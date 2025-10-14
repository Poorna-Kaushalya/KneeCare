// routes/sensor.js
const express = require("express");
const RawSensorData = require("../models/RawSensorData");
const AvgSensorData = require("../models/AvgSensorData");

const router = express.Router();

// ✅ Save raw sensor data
router.post("/api/sensor-data", async (req, res) => {
  try {
    const newData = new RawSensorData(req.body);
    await newData.save();
    res.json({ success: true });
  } catch (err) {
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
    res.json({ connected: false });
  }
});

// ✅ Get latest 10 average records
router.get("/api/sensor-data", async (req, res) => {
  const data = await AvgSensorData.find().sort({ createdAt: -1 }).limit(10);
  res.json(data);
});

// ✅ Calculate 5-min averages every 5 minutes
setInterval(async () => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const rawData = await RawSensorData.find({
    createdAt: { $gte: fiveMinutesAgo },
  });

  if (rawData.length > 0) {
    const device_id = rawData[0].device_id;

    let sum_upper = { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0, temp: 0 };
    let sum_lower = { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0, temp: 0 };
    let sum_angle = 0;
    let sum_temp = { ambient: 0, object: 0 };

    rawData.forEach((d) => {
      // Upper sensor sums
      sum_upper.ax += d.upper.ax;
      sum_upper.ay += d.upper.ay;
      sum_upper.az += d.upper.az;
      sum_upper.gx += d.upper.gx || 0;
      sum_upper.gy += d.upper.gy || 0;
      sum_upper.gz += d.upper.gz || 0;
      sum_upper.temp += d.upper.temp || 0;

      // Lower sensor sums
      sum_lower.ax += d.lower.ax;
      sum_lower.ay += d.lower.ay;
      sum_lower.az += d.lower.az;
      sum_lower.gx += d.lower.gx || 0;
      sum_lower.gy += d.lower.gy || 0;
      sum_lower.gz += d.lower.gz || 0;
      sum_lower.temp += d.lower.temp || 0;

      // Knee angle
      sum_angle += d.knee_angle || 0;

      // Temperature sensor (MLX90614)
      if (d.temperature) {
        sum_temp.ambient += d.temperature.ambient || 0;
        sum_temp.object += d.temperature.object || 0;
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
    });

    await avgData.save();
    await RawSensorData.deleteMany({ _id: { $in: rawData.map((d) => d._id) } });
    console.log(`✅ Saved 5-min average & deleted ${rawData.length} raw entries`);
  }
}, 5 * 60 * 1000);

module.exports = router;
