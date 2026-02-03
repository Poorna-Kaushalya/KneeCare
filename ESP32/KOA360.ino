#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <MPU6050_light.h>
#include <Adafruit_MLX90614.h>
#include <driver/i2s.h>
#include <math.h>

/* ================= Configuration ================= */
const char* ssid = "Dialog 4G 287";
const char* password = "181969F7";
String serverUrl = "http://192.168.8.102:5000/api/sensor-data";

/* ================= Sensors & Pins ================= */
MPU6050 mpuUpper(Wire);
MPU6050 mpuLower(Wire);
Adafruit_MLX90614 mlx;

#define I2S_PORT I2S_NUM_0
#define I2S_BCLK 14
#define I2S_WS   15
#define I2S_SD   32

#define SAMPLE_RATE 16000
#define AUDIO_SAMPLES 512
int32_t audioBuffer[AUDIO_SAMPLES];

unsigned long lastSend = 0;
const unsigned long sendInterval = 1000; 

/* ================= Knee Angle Logic ================= */
float calculateKneeAngle(float ax1, float ay1, float az1,
                         float ax2, float ay2, float az2) {
  float mag1 = sqrt(ax1*ax1 + ay1*ay1 + az1*az1);
  float mag2 = sqrt(ax2*ax2 + ay2*ay2 + az2*az2);
  if (mag1 < 0.1 || mag2 < 0.1) return 0;

  float dot = (ax1*ax2 + ay1*ay2 + az1*az2) / (mag1 * mag2);
  dot = constrain(dot, -1.0, 1.0);
  return acos(dot) * 180.0 / PI;
}

/* ================= WiFi (Battery Optimized) ================= */
void connectWiFi() {
  Serial.println("\n📡 Connecting to WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  // If battery is weak, WiFi might fail. We try for 10 seconds.
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected");
    Serial.print("Local IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ Connection Failed. Checking power/signal...");
  }
}

/* ================= I2S Mic Init ================= */
void initI2SMic() {
  i2s_config_t config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 64,
    .use_apll = false
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

/* ================= Audio Features ================= */
void computeAudio(float &rms, float &peak, float &energy) {
  size_t bytesRead;
  i2s_read(I2S_PORT, audioBuffer, sizeof(audioBuffer), &bytesRead, portMAX_DELAY);

  int samples = bytesRead / sizeof(int32_t);
  double sumSq = 0;
  peak = 0;

  for (int i = 0; i < samples; i++) {
    float sample = (float)(audioBuffer[i] >> 14); 
    sumSq += sample * sample;
    if (abs(sample) > peak) peak = abs(sample);
  }

  rms = sqrt(sumSq / samples);
  energy = sumSq;
}

/* ================= Setup (Staggered Power On) ================= */
void setup() {
  Serial.begin(115200);
  delay(1000); // Wait for power rail to stabilize
  
  Wire.begin();
  
  //  Connect WiFi first before drawing sensor current
  connectWiFi();

  // Initialize Sensors
  if (!mlx.begin()) Serial.println(" MLX90614 Not Found");
  
  byte status = mpuUpper.begin();
  Serial.print("MPU Upper status: "); Serial.println(status);
  
  status = mpuLower.begin();
  Serial.print("MPU Lower status: "); Serial.println(status);

  Serial.println("Calibrating MPUs... Keep Level");
  mpuUpper.calcOffsets(true, true);
  mpuLower.calcOffsets(true, true);

  initI2SMic();
  Serial.println("KOA360 Ready");
}

/* ================= Loop ================= */
void loop() {
  // Check WiFi status and reconnect if battery dip dropped it
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (millis() - lastSend < sendInterval) return;
  lastSend = millis();

  mpuUpper.update();
  mpuLower.update();

  float kneeAngle = calculateKneeAngle(
    mpuUpper.getAccX(), mpuUpper.getAccY(), mpuUpper.getAccZ(),
    mpuLower.getAccX(), mpuLower.getAccY(), mpuLower.getAccZ()
  );

  float rms, peak, energy;
  computeAudio(rms, peak, energy);

  // JSON Construction
  String json = "{";
  json += "\"device_id\":\"KOA360-001\",";
  json += "\"upper\":{\"ax\":" + String(mpuUpper.getAccX(),3) + ",\"ay\":" + String(mpuUpper.getAccY(),3) + ",\"az\":" + String(mpuUpper.getAccZ(),3) + "},";
  json += "\"lower\":{\"ax\":" + String(mpuLower.getAccX(),3) + ",\"ay\":" + String(mpuLower.getAccY(),3) + ",\"az\":" + String(mpuLower.getAccZ(),3) + "},";
  json += "\"knee_angle\":" + String(kneeAngle,2) + ",";
  json += "\"temperature\":{\"ambient\":" + String(mlx.readAmbientTempC(),2) + ",\"object\":" + String(mlx.readObjectTempC(),2) + "},";
  json += "\"microphone\":{\"rms\":" + String(rms,2) + ",\"peak\":" + String(peak,2) + ",\"energy\":" + String(energy,2) + "}";
  json += "}";

  // HTTP Post with Timeout
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.setTimeout(3000); // 3 second timeout for battery efficiency
    http.addHeader("Content-Type", "application/json");

    int code = http.POST(json);
    
    Serial.print("📡 HTTP Code: ");
    Serial.println(code);
    
    if(code < 0) {
      Serial.printf("Error: %s\n", http.errorToString(code).c_str());
    }
    
    http.end();
  }
}