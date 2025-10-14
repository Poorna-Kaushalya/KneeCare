#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <MPU6050_light.h>
#include <Adafruit_MLX90614.h>
#include <math.h>

// ========== WiFi Credentials ==========
const char* ssid = "Dialog 4G 287";
const char* password = "181969F7";

// ========== Backend URL ==========
String serverUrl = "http://192.168.8.102:5000/api/sensor-data";

// ========== Sensor Objects ==========
MPU6050 mpuUpper(Wire);
MPU6050 mpuLower(Wire);
Adafruit_MLX90614 mlx = Adafruit_MLX90614();

// ========== Timing ==========
unsigned long lastSend = 0;
const unsigned long sendInterval = 1000; // 1 second

// ========== Function to calculate knee angle ==========
float calculateKneeAngle(float ax1, float ay1, float az1, float ax2, float ay2, float az2) {
  float mag1 = sqrt(ax1 * ax1 + ay1 * ay1 + az1 * az1);
  float mag2 = sqrt(ax2 * ax2 + ay2 * ay2 + az2 * az2);
  ax1 /= mag1; ay1 /= mag1; az1 /= mag1;
  ax2 /= mag2; ay2 /= mag2; az2 /= mag2;
  float dot = ax1 * ax2 + ay1 * ay2 + az1 * az2;
  if (dot > 1) dot = 1;
  if (dot < -1) dot = -1;
  return acos(dot) * 180.0 / PI;
}

// ========== WiFi Connection ==========
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

// ========== Setup ==========
void setup() {
  Serial.begin(115200);
  Wire.begin();

  connectWiFi();

  // Initialize MPU6050 sensors
  if (mpuUpper.begin() != 0) {
    Serial.println("❌ Failed to initialize upper MPU6050");
  }
  if (mpuLower.begin() != 0) {
    Serial.println("❌ Failed to initialize lower MPU6050");
  }

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

// ========== Main Loop ==========
void loop() {
  // Update MPU data
  mpuUpper.update();
  mpuLower.update();

  // Upper sensor acceleration
  float ax1 = mpuUpper.getAccX();
  float ay1 = mpuUpper.getAccY();
  float az1 = mpuUpper.getAccZ();

  // Lower sensor acceleration
  float ax2 = mpuLower.getAccX();
  float ay2 = mpuLower.getAccY();
  float az2 = mpuLower.getAccZ();

  // Calculate knee angle
  float kneeAngle = calculateKneeAngle(ax1, ay1, az1, ax2, ay2, az2);

  // Temperature readings
  double ambientTemp = mlx.readAmbientTempC();
  double objectTemp = mlx.readObjectTempC();

  // Prepare JSON payload
  String json = "{";
  json += "\"device_id\":\"KOA360-001\",";
  json += "\"upper\":{";
  json += "\"ax\":" + String(ax1, 2) + ",";
  json += "\"ay\":" + String(ay1, 2) + ",";
  json += "\"az\":" + String(az1, 2) + ",";
  json += "\"gx\":" + String(mpuUpper.getGyroX()) + ",";
  json += "\"gy\":" + String(mpuUpper.getGyroY()) + ",";
  json += "\"gz\":" + String(mpuUpper.getGyroZ());
  json += "},";
  json += "\"lower\":{";
  json += "\"ax\":" + String(ax2, 2) + ",";
  json += "\"ay\":" + String(ay2, 2) + ",";
  json += "\"az\":" + String(az2, 2) + ",";
  json += "\"gx\":" + String(mpuLower.getGyroX()) + ",";
  json += "\"gy\":" + String(mpuLower.getGyroY()) + ",";
  json += "\"gz\":" + String(mpuLower.getGyroZ());
  json += "},";
  json += "\"knee_angle\":" + String(kneeAngle, 2) + ",";
  json += "\"temperature\":{";
  json += "\"ambient\":" + String(ambientTemp, 2) + ",";
  json += "\"object\":" + String(objectTemp, 2);
  json += "}";
  json += "}";

  Serial.println(json);

  // Send to server
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
  }

  delay(sendInterval);
}
