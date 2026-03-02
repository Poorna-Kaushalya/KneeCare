/************************************************************
  KOA360 ESP32 — MPU6050(upper+lower) + MLX90614 + INMP441(I2S)
  Sends RAW + mic features + aligned mic features to Node server

  FIXES INCLUDED:
  ✅ Correct INMP441 24-bit sign extension (prevents RMS=0)
  ✅ Prints RMS with more precision
  ✅ Sends microphone + microphone_features + microphone_features_aligned
  ✅ Keeps your existing JSON structure (compatible with your backend)

  Wiring (INMP441):
  VDD -> 3.3V
  GND -> GND
  SCK/BCLK -> GPIO 14
  WS/LRCL -> GPIO 15
  SD -> GPIO 32
  L/R -> GND (LEFT)

************************************************************/

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <MPU6050_light.h>
#include <Adafruit_MLX90614.h>
#include <driver/i2s.h>
#include <math.h>
#include <arduinoFFT.h>

/* ================= WiFi ================= */
const char* ssid     = "Dialog 4G 287";
const char* password = "181969F7";
String serverUrl = "http://192.168.8.102:5000/api/sensor-data";

/* ================= Sensors ================= */
MPU6050 mpuUpper(Wire);
MPU6050 mpuLower(Wire);
Adafruit_MLX90614 mlx;

/* ================= INMP441 I2S ================= */
#define I2S_PORT I2S_NUM_0
#define I2S_BCLK 14
#define I2S_WS   15
#define I2S_SD   32

#define SAMPLE_RATE   16000
#define N_SAMPLES     512

int32_t i2sBuf[N_SAMPLES];

double vReal[N_SAMPLES];
double vImag[N_SAMPLES];
double noiseMag[N_SAMPLES / 2];

ArduinoFFT<double> FFT(vReal, vImag, N_SAMPLES, SAMPLE_RATE);

/* ================= Timing ================= */
unsigned long lastSend = 0;
const unsigned long sendInterval = 1000;

/* ================= Knee Angle ================= */
float calculateKneeAngle(float ax1, float ay1, float az1,
                         float ax2, float ay2, float az2) {
  float mag1 = sqrt(ax1*ax1 + ay1*ay1 + az1*az1);
  float mag2 = sqrt(ax2*ax2 + ay2*ay2 + az2*az2);
  if (mag1 < 0.1 || mag2 < 0.1) return 0;

  float dot = (ax1*ax2 + ay1*ay2 + az1*az2) / (mag1 * mag2);
  dot = constrain(dot, -1.0, 1.0);
  return acos(dot) * 180.0 / PI;
}

/* ================= WiFi ================= */
void connectWiFi() {
  Serial.println("\n📡 Connecting WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.setTxPower(WIFI_POWER_19_5dBm);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Failed");
  }
}

/* ================= I2S Mic ================= */
void initI2SMic() {
  i2s_config_t config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S_MSB,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 64,
    .use_apll = false,
    .tx_desc_auto_clear = false,
    .fixed_mclk = 0
  };

  i2s_pin_config_t pins = {
    .bck_io_num = I2S_BCLK,
    .ws_io_num = I2S_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = I2S_SD
  };

  i2s_driver_install(I2S_PORT, &config, 0, NULL);
  i2s_set_pin(I2S_PORT, &pins);
  i2s_zero_dma_buffer(I2S_PORT);
}

/* ================= Read audio frame ================= */
int readAudioFrame() {
  size_t bytesRead = 0;
  esp_err_t err = i2s_read(I2S_PORT, (void*)i2sBuf, sizeof(i2sBuf), &bytesRead, portMAX_DELAY);
  if (err != ESP_OK) return 0;
  return (int)(bytesRead / sizeof(int32_t));
}

double clampd(double x, double lo, double hi) {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}

/* ================= Mic features + noise subtraction ================= */
void computeMicFeatures(
  double &raw_rms_norm,
  double &raw_peak_freq,
  double &raw_entropy_norm,
  double &raw_zcr,
  double &raw_mean_freq,

  double &ds_rms_amplitude,
  double &ds_peak_frequency,
  double &ds_spectral_entropy,
  double &ds_zero_crossing_rate,
  double &ds_mean_frequency
) {
  int n = readAudioFrame();
  if (n <= 0) {
    raw_rms_norm = 0; raw_peak_freq = 0; raw_entropy_norm = 0; raw_zcr = 0; raw_mean_freq = 0;

    // aligned defaults (still within your dataset ranges)
    ds_rms_amplitude = 1.003640393;
    ds_peak_frequency = 20;
    ds_spectral_entropy = -2412;
    ds_zero_crossing_rate = 0;
    ds_mean_frequency = 42;
    return;
  }

  // High-pass filter (DC removal)
  static double hp_y = 0, hp_x_prev = 0;
  const double hp_alpha = 0.995;

  double sumSq = 0;
  int zc = 0;

  for (int i = 0; i < N_SAMPLES; i++) {
    double x = 0.0;

    if (i < n) {
      // ✅ FIX: INMP441 24-bit sign extend inside 32-bit
      int32_t s32 = i2sBuf[i];
      int32_t s24 = s32 >> 8;                 // keep 24 MSBs
      if (s24 & 0x00800000) s24 |= 0xFF000000; // sign extend 24-bit
      x = (double)s24 / 8388608.0;            // 2^23 -> [-1..1]
    }

    double y = hp_alpha * (hp_y + x - hp_x_prev);
    hp_x_prev = x;
    hp_y = y;

    vReal[i] = y;
    vImag[i] = 0.0;

    sumSq += y * y;

    if (i > 0) {
      double prev = vReal[i - 1];
      if ((prev >= 0 && y < 0) || (prev < 0 && y >= 0)) zc++;
    }
  }

  raw_rms_norm = sqrt(sumSq / (double)N_SAMPLES);
  raw_zcr = (double)zc / (double)(N_SAMPLES - 1);

  // FFT
  FFT.windowing(FFTWindow::Hamming, FFTDirection::Forward);
  FFT.compute(FFTDirection::Forward);
  FFT.complexToMagnitude();

  const int half = N_SAMPLES / 2;

  // Noise subtraction in frequency domain
  const double alpha = 1.2;
  const double learnThresh = 0.03;
  const double beta = 0.90;
  bool learnNoise = (raw_rms_norm < learnThresh);

  static double cleanMag[N_SAMPLES/2];

  double cleanSum = 0;
  double weightedSum = 0;
  double maxMag = 0;
  int maxIdx = 1;

  for (int k = 1; k < half; k++) {
    double mag = vReal[k];

    if (learnNoise) {
      noiseMag[k] = beta * noiseMag[k] + (1.0 - beta) * mag;
    }

    double c = mag - alpha * noiseMag[k];
    if (c < 0) c = 0;

    cleanMag[k] = c;
    cleanSum += c;

    if (c > maxMag) { maxMag = c; maxIdx = k; }
  }

  raw_peak_freq = (double)maxIdx * ((double)SAMPLE_RATE / (double)N_SAMPLES);

  if (cleanSum > 1e-9) {
    for (int k = 1; k < half; k++) {
      double f = (double)k * ((double)SAMPLE_RATE / (double)N_SAMPLES);
      weightedSum += cleanMag[k] * f;
    }
    raw_mean_freq = weightedSum / cleanSum;
  } else {
    raw_mean_freq = 0;
  }

  // Normalized spectral entropy
  if (cleanSum > 1e-9) {
    double H = 0;
    for (int k = 1; k < half; k++) {
      double p = cleanMag[k] / cleanSum;
      if (p > 1e-12) H += -p * log(p);
    }
    double Hmax = log((double)(half - 1));
    raw_entropy_norm = (Hmax > 0) ? (H / Hmax) : 0;
  } else {
    raw_entropy_norm = 0;
  }

  // ========= Dataset alignment (your ranges) =========
  // ✅ You asked where to add scaling: RIGHT HERE
  double scaled = raw_rms_norm * 10.0; // try 5.0 / 10.0 / 20.0
  ds_rms_amplitude = clampd(1.0 + scaled, 1.003640393, 1.264898647);

  ds_peak_frequency = 20.0;

  double se = (-1000.0 * raw_entropy_norm * 3.0) - 1400.0;
  ds_spectral_entropy = clampd(se, -3915.364528, -1453.671345);

  double zcr_small = (raw_zcr - 0.5) * 0.002;
  ds_zero_crossing_rate = clampd(zcr_small, -0.001, 0.001);

  double mf = raw_mean_freq / 100.0;
  ds_mean_frequency = clampd(mf, 37.91084979, 47.60796161);
}

/* ================= Setup ================= */
void setup() {
  Serial.begin(115200);
  delay(1500);

  Wire.begin();
  connectWiFi();

  if (!mlx.begin()) Serial.println("❌ MLX90614 not found");

  mpuUpper.begin();
  mpuLower.begin();

  Serial.println("🧭 Calibrating MPU6050s...");
  mpuUpper.calcOffsets(true, true);
  mpuLower.calcOffsets(true, true);

  for (int i = 0; i < N_SAMPLES/2; i++) noiseMag[i] = 0;

  initI2SMic();
  Serial.println("✅ KOA360 READY");
}

/* ================= Loop ================= */
void loop() {
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  if (millis() - lastSend < sendInterval) return;
  lastSend = millis();

  mpuUpper.update();
  mpuLower.update();

  float kneeAngle = calculateKneeAngle(
    mpuUpper.getAccX(), mpuUpper.getAccY(), mpuUpper.getAccZ(),
    mpuLower.getAccX(), mpuLower.getAccY(), mpuLower.getAccZ()
  );

  float ambT = mlx.readAmbientTempC();
  float objT = mlx.readObjectTempC();

  double raw_rms_norm, raw_peak_freq, raw_entropy_norm, raw_zcr, raw_mean_freq;
  double ds_rms_amp, ds_peak_f, ds_spec_ent, ds_zcr, ds_mean_f;

  computeMicFeatures(
    raw_rms_norm, raw_peak_freq, raw_entropy_norm, raw_zcr, raw_mean_freq,
    ds_rms_amp, ds_peak_f, ds_spec_ent, ds_zcr, ds_mean_f
  );

  // ✅ debug RMS (more precision)
  Serial.print("raw_rms_norm=");
  Serial.println(raw_rms_norm, 9);

  // Legacy mic fields (keep for DB compatibility)
  double mic_rms = raw_rms_norm;
  double mic_energy = raw_rms_norm * raw_rms_norm;
  double mic_peak = raw_peak_freq;  // Hz

  // ========= Build JSON =========
  String json = "{";
  json += "\"device_id\":\"KOA360-001\",";

  json += "\"upper\":{";
  json += "\"ax\":" + String(mpuUpper.getAccX(),3) + ",";
  json += "\"ay\":" + String(mpuUpper.getAccY(),3) + ",";
  json += "\"az\":" + String(mpuUpper.getAccZ(),3) + ",";
  json += "\"gx\":" + String(mpuUpper.getGyroX(),3) + ",";
  json += "\"gy\":" + String(mpuUpper.getGyroY(),3) + ",";
  json += "\"gz\":" + String(mpuUpper.getGyroZ(),3) + ",";
  json += "\"temp\":" + String(mpuUpper.getTemp(),2);
  json += "},";

  json += "\"lower\":{";
  json += "\"ax\":" + String(mpuLower.getAccX(),3) + ",";
  json += "\"ay\":" + String(mpuLower.getAccY(),3) + ",";
  json += "\"az\":" + String(mpuLower.getAccZ(),3) + ",";
  json += "\"gx\":" + String(mpuLower.getGyroX(),3) + ",";
  json += "\"gy\":" + String(mpuLower.getGyroY(),3) + ",";
  json += "\"gz\":" + String(mpuLower.getGyroZ(),3) + ",";
  json += "\"temp\":" + String(mpuLower.getTemp(),2);
  json += "},";

  json += "\"knee_angle\":" + String(kneeAngle,2) + ",";

  json += "\"temperature\":{";
  json += "\"ambient\":" + String(ambT,2) + ",";
  json += "\"object\":" + String(objT,2);
  json += "},";

  // keep your spelling (DB compatible)
  json += "\"knee_tempurarture\":" + String(objT,2) + ",";

  // ✅ legacy mic (so Avg job can average it)
  json += "\"microphone\":{";
  json += "\"rms\":" + String(mic_rms, 9) + ",";
  json += "\"peak\":" + String(mic_peak, 3) + ",";
  json += "\"energy\":" + String(mic_energy, 9);
  json += "},";

  // ✅ raw features (not aligned)
  json += "\"microphone_features\":{";
  json += "\"rms_amplitude\":" + String(raw_rms_norm, 9) + ",";
  json += "\"peak_frequency\":" + String(raw_peak_freq, 3) + ",";
  json += "\"spectral_entropy\":" + String(raw_entropy_norm, 6) + ",";
  json += "\"zero_crossing_rate\":" + String(raw_zcr, 6) + ",";
  json += "\"mean_frequency\":" + String(raw_mean_freq, 3);
  json += "},";

  // ✅ aligned features (dataset ranges)
  json += "\"microphone_features_aligned\":{";
  json += "\"rms_amplitude\":" + String(ds_rms_amp, 6) + ",";
  json += "\"peak_frequency\":" + String(ds_peak_f, 3) + ",";
  json += "\"spectral_entropy\":" + String(ds_spec_ent, 3) + ",";
  json += "\"zero_crossing_rate\":" + String(ds_zcr, 6) + ",";
  json += "\"mean_frequency\":" + String(ds_mean_f, 3);
  json += "}";

  json += "}";

  Serial.println(json);

  // ========= Send =========
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.setTimeout(3000);
    http.addHeader("Content-Type", "application/json");
    int code = http.POST(json);
    Serial.print("HTTP: ");
    Serial.println(code);
    http.end();
  }
}
