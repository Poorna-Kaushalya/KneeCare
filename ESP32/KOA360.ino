#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <MPU6050_light.h>
#include <Adafruit_MLX90614.h>
#include <math.h>

// ==================== WiFi Credentials ====================
const char* ssid     = "Dialog 4G 287";
const char* password = "181969F7";

// ==================== Backend URL =========================
String serverUrl = "http://192.168.8.102:5000/api/sensor-data";

// ==================== Sensor Objects ======================
MPU6050 mpuUpper(Wire);
MPU6050 mpuLower(Wire);
Adafruit_MLX90614 mlx = Adafruit_MLX90614();

// LM393 microphone / piezo (MD0220 module)
const int MIC_AO_PIN = 34;   // Analog out from LM393 -> GPIO 34
const int MIC_DO_PIN = 25;   // Digital out (optional) -> GPIO 25

// ==================== Timing ==============================
unsigned long lastSend = 0;
const unsigned long sendInterval = 1000; // 1 second

// ==================== Knee Angle Function =================
float calculateKneeAngle(float ax1, float ay1, float az1,
                         float ax2, float ay2, float az2) {
  float mag1 = sqrt(ax1 * ax1 + ay1 * ay1 + az1 * az1);
  float mag2 = sqrt(ax2 * ax2 + ay2 * ay2 + az2 * az2);

  if (mag1 == 0 || mag2 == 0) return 0;

  ax1 /= mag1; ay1 /= mag1; az1 /= mag1;
  ax2 /= mag2; ay2 /= mag2; az2 /= mag2;

  float dot = ax1 * ax2 + ay1 * ay2 + az1 * az2;
  if (dot > 1) dot = 1;
  if (dot < -1) dot = -1;

  return acos(dot) * 180.0 / PI;   // in degrees
}

// ==================== WiFi Connection =====================
void connectWiFi() {
  Serial.print("Connecting to WiFi ");
  WiFi.begin(ssid, password);
  int retryCount = 0;
  while (WiFi.status() != WL_CONNECTED && retryCount < 20) {
    delay(500);
    Serial.print(".");
    retryCount++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi connection failed!");
  }
}

// ==================== Setup ===============================
void setup() {
  Serial.begin(115200);
  Wire.begin();

  // LM393 pins
  pinMode(MIC_AO_PIN, INPUT);   // Analog input
  pinMode(MIC_DO_PIN, INPUT);   // Digital input (trigger)

  // Optional: set full-scale ADC range on ESP32
  analogSetPinAttenuation(MIC_AO_PIN, ADC_11db); // for 0–3.3 V range

  connectWiFi();

  // Initialize MPU6050 sensors
  if (mpuUpper.begin() != 0) {
    Serial.println("❌ Failed to initialize upper MPU6050");
  }
  if (mpuLower.begin() != 0) {
    Serial.println("❌ Failed to initialize lower MPU6050");
  }

  // Calibrate IMUs (keep sensor still during this)
  mpuUpper.calcOffsets(true, true);
  mpuLower.calcOffsets(true, true);
  Serial.println("✅ MPU6050 sensors calibrated");

  // Initialize MLX90614
  if (!mlx.begin()) {
    Serial.println("❌ MLX90614 not found. Check wiring.");
  } else {
    Serial.println("✅ MLX90614 temperature sensor ready");
  }
}

// ==================== Main Loop ==========================
void loop() {
  unsigned long now = millis();
  if (now - lastSend < sendInterval) {
    // Still within interval; you can do other tasks here
    return;
  }
  lastSend = now;

  // ---- Update IMUs ----
  mpuUpper.update();
  mpuLower.update();

  // Upper sensor acceleration (g)
  float ax1 = mpuUpper.getAccX();
  float ay1 = mpuUpper.getAccY();
  float az1 = mpuUpper.getAccZ();

  // Lower sensor acceleration (g)
  float ax2 = mpuLower.getAccX();
  float ay2 = mpuLower.getAccY();
  float az2 = mpuLower.getAccZ();

  // Upper gyro (deg/s)
  float gx1 = mpuUpper.getGyroX();
  float gy1 = mpuUpper.getGyroY();
  float gz1 = mpuUpper.getGyroZ();

  // Lower gyro (deg/s)
  float gx2 = mpuLower.getGyroX();
  float gy2 = mpuLower.getGyroY();
  float gz2 = mpuLower.getGyroZ();

  // ---- Knee Angle ----
  float kneeAngle = calculateKneeAngle(ax1, ay1, az1, ax2, ay2, az2);

  // ---- Temperature (MLX90614) ----
  double ambientTemp = mlx.readAmbientTempC();
  double objectTemp  = mlx.readObjectTempC();

  // ---- LM393 Vibration (Piezo) ----
  int   micRaw      = analogRead(MIC_AO_PIN);               // 0–4095
  float micVoltage  = micRaw * (3.3 / 4095.0);              // in volts
  int   micDigital  = digitalRead(MIC_DO_PIN);              // 0 or 1 (threshold)

  // Serial debug
  Serial.print("LM393 Raw: ");
  Serial.print(micRaw);
  Serial.print("  Voltage: ");
  Serial.print(micVoltage, 3);
  Serial.print(" V  Digital: ");
  Serial.println(micDigital);

  // ==================== Build JSON Payload ====================
  String json = "{";

  json += "\"device_id\":\"KOA360-001\",";

  // Upper IMU
  json += "\"upper\":{";
  json += "\"ax\":" + String(ax1, 3) + ",";
  json += "\"ay\":" + String(ay1, 3) + ",";
  json += "\"az\":" + String(az1, 3) + ",";
  json += "\"gx\":" + String(gx1, 3) + ",";
  json += "\"gy\":" + String(gy1, 3) + ",";
  json += "\"gz\":" + String(gz1, 3);
  json += "},";

  // Lower IMU
  json += "\"lower\":{";
  json += "\"ax\":" + String(ax2, 3) + ",";
  json += "\"ay\":" + String(ay2, 3) + ",";
  json += "\"az\":" + String(az2, 3) + ",";
  json += "\"gx\":" + String(gx2, 3) + ",";
  json += "\"gy\":" + String(gy2, 3) + ",";
  json += "\"gz\":" + String(gz2, 3);
  json += "},";

  // Knee angle
  json += "\"knee_angle\":" + String(kneeAngle, 2) + ",";

  // Temperature
  json += "\"temperature\":{";
  json += "\"ambient\":" + String(ambientTemp, 2) + ",";
  json += "\"object\":"  + String(objectTemp, 2);
  json += "},";

  // piezo / Piezo data from LM393
  json += "\"piezo\":{";
  json += "\"raw\":"      + String(micRaw) + ",";
  json += "\"voltage\":"  + String(micVoltage, 3) + ",";
  json += "\"trigger\":"  + String(micDigital);
  json += "}";

  json += "}";

  Serial.println("JSON:");
  Serial.println(json);

  // ==================== Send to Server ====================
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    int code = http.POST(json);

    if (code > 0) {
      Serial.print("✅ Data sent | HTTP code: ");
      Serial.println(code);
    } else {
      Serial.print("❌ Failed to send data | Error: ");
      Serial.println(code);
    }
    http.end();
  } else {
    Serial.println("⚠️ WiFi not connected, data not sent");
  }
}
