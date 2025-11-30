// routes/sensor.js
const express = require("express");
const RawSensorData = require("../models/RawSensorData");
const AvgSensorData = require("../models/AvgSensorData");

const router = express.Router();

// ✅ Save raw sensor data (includes piezo)
router.post("/api/sensor-data", async (req, res) => {
  try {
    const newData = new RawSensorData(req.body);
    await newData.save();
    res.json({ success: true });
  } catch (err) {
    console.error("sensor-data save error:", err.message);
    res.status(400).json({ error: err.message });
  }
});

// ✅ Check device connection status
router.get("/api/device-status", async (req, res) => {
  try {
    const recentData = await RawSensorData.findOne({}, {}, { sort: { createdAt: -1 } });
    const connected = recentData && new Date() - recentData.createdAt < 10000;
    res.json({ connected });
  } catch (err) {
    console.error("device-status error:", err.message);
    res.json({ connected: false });
  }
});

// ✅ Get latest 10 average records
router.get("/api/sensor-data", async (req, res) => {
  try {
    const data = await AvgSensorData.find().sort({ createdAt: -1 }).limit(10);
    res.json(data);
  } catch (err) {
    console.error("get avg sensor-data error:", err.message);
    res.status(500).json({ error: "Failed to fetch average sensor data" });
  }
});

// ✅ Calculate 5-min averages every 5 minutes
setInterval(async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const rawData = await RawSensorData.find({
      createdAt: { $gte: fiveMinutesAgo },
    });

    if (!rawData.length) return;

    const device_id = rawData[0].device_id;

    let sum_upper = { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0, temp: 0 };
    let sum_lower = { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0, temp: 0 };
    let sum_angle = 0;
    let sum_temp = { ambient: 0, object: 0 };

    // 🔥 NEW: piezo sums
    let sum_piezo = { raw: 0, voltage: 0, trigger: 0 };
    let piezoCount = 0;

    rawData.forEach((d) => {
      // Upper sensor sums (add null-safety)
      if (d.upper) {
        sum_upper.ax += d.upper.ax || 0;
        sum_upper.ay += d.upper.ay || 0;
        sum_upper.az += d.upper.az || 0;
        sum_upper.gx += d.upper.gx || 0;
        sum_upper.gy += d.upper.gy || 0;
        sum_upper.gz += d.upper.gz || 0;
        sum_upper.temp += d.upper.temp || 0;
      }

      // Lower sensor sums
      if (d.lower) {
        sum_lower.ax += d.lower.ax || 0;
        sum_lower.ay += d.lower.ay || 0;
        sum_lower.az += d.lower.az || 0;
        sum_lower.gx += d.lower.gx || 0;
        sum_lower.gy += d.lower.gy || 0;
        sum_lower.gz += d.lower.gz || 0;
        sum_lower.temp += d.lower.temp || 0;
      }

      // Knee angle
      sum_angle += d.knee_angle || 0;

      // Temperature sensor 
      if (d.temperature) {
        sum_temp.ambient += d.temperature.ambient || 0;
        sum_temp.object += d.temperature.object || 0;
      }

      // 🔥 Piezo (VAG) sensor
      if (d.piezo) {
        sum_piezo.raw += d.piezo.raw || 0;
        sum_piezo.voltage += d.piezo.voltage || 0;
        sum_piezo.trigger += d.piezo.trigger || 0; // usually 0/1
        piezoCount++;
      }
    });

    const count = rawData.length;

    const avgData = new AvgSensorData({
      device_id,
      avg_upper: {
        ax: sum_upper.ax / count,
        ay: sum_upper.ay / count,
        az: sum_upper.az / count,
        gx: sum_upper.gx / count,
        gy: sum_upper.gy / count,
        gz: sum_upper.gz / count,
        temp: sum_upper.temp / count,
      },
      avg_lower: {
        ax: sum_lower.ax / count,
        ay: sum_lower.ay / count,
        az: sum_lower.az / count,
        gx: sum_lower.gx / count,
        gy: sum_lower.gy / count,
        gz: sum_lower.gz / count,
        temp: sum_lower.temp / count,
      },
      avg_knee_angle: sum_angle / count,
      avg_temperature: {
        ambient: sum_temp.ambient / count,
        object: sum_temp.object / count,
      },

      // 🔥 store averaged piezo if any samples had piezo data
      avg_piezo: piezoCount > 0
        ? {
          raw: sum_piezo.raw / piezoCount,      // mean ADC
          voltage: sum_piezo.voltage / piezoCount,    // mean voltage
          // fraction of samples where trigger == 1 (0–1)
          trigger_rate: sum_piezo.trigger / piezoCount,
        }
        : undefined,
    });

    await avgData.save();
    await RawSensorData.deleteMany({ _id: { $in: rawData.map((d) => d._id) } });
    console.log(`✅ Saved 5-min average & deleted ${rawData.length} raw entries`);
  } catch (err) {
    console.error("5-min average error:", err.message);
  }
}, 5 * 60 * 1000);

// 📈 Get average records filtered by device ID and configurable time range
router.get("/api/sensor-datas", async (req, res) => {
  try {
    const { deviceId, range } = req.query;

    if (!deviceId) {
      return res.status(400).json({ error: "Missing deviceId query parameter." });
    }

    // Default to 7 days if no valid range is provided
    const days = parseInt(range, 10) || 7;
    
    // Calculate the start date (number of days ago)
    // days * 24 (hours) * 60 (minutes) * 60 (seconds) * 1000 (milliseconds)
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000); 

    // Query for data greater than or equal to startDate
    const data = await AvgSensorData.find({
      device_id: deviceId,
      createdAt: { $gte: startDate } // Filter by date
    })
      .sort({ createdAt: 1 }); // Sort oldest to newest (ascending) for charts

    if (!data || data.length === 0) {
      return res.status(404).json({ error: `No sensor data found for device ID: ${deviceId} in the last ${days} day(s).` });
    }

    res.json(data);
  } catch (err) {
    console.error("get filtered avg sensor-data error:", err.message);
    res.status(500).json({ error: "Failed to fetch filtered sensor data" });
  }
});

module.exports = router;