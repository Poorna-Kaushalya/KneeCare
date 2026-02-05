const express = require("express");
const RawSensorData = require("../models/RawSensorData");
const AvgSensorData = require("../models/AvgSensorData");

const router = express.Router();

/* ================= SAVE RAW SENSOR DATA ================= */
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

/* ================= DEVICE STATUS ================= */
router.get("/api/device-status", async (req, res) => {
  try {
    const recentData = await RawSensorData.findOne({}, {}, { sort: { createdAt: -1 } });
    const connected =
      recentData && new Date() - recentData.createdAt < 10000; // 10s
    res.json({ connected });
  } catch (err) {
    console.error("device-status error:", err.message);
    res.json({ connected: false });
  }
});

/* ================= GET LAST 10 AVG RECORDS ================= */
router.get("/api/sensor-data", async (req, res) => {
  try {
    const data = await AvgSensorData.find()
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(data);
  } catch (err) {
    console.error("get avg sensor-data error:", err.message);
    res.status(500).json({ error: "Failed to fetch average sensor data" });
  }
});

/* ================= 5-MIN AVERAGING JOB ================= */
setInterval(async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const rawData = await RawSensorData.find({
      createdAt: { $gte: fiveMinutesAgo },
    });

    if (!rawData.length) return;

    const device_id = rawData[0].device_id;
    const count = rawData.length;

    let sum_upper = { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0, temp: 0 };
    let sum_lower = { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0, temp: 0 };
    let sum_angle = 0;
    let sum_temp = { ambient: 0, object: 0 };
    let sum_mic = { rms: 0, peak: 0, energy: 0 };
    let micCount = 0;

    rawData.forEach((d) => {
      if (d.upper) {
        Object.keys(sum_upper).forEach(
          (k) => (sum_upper[k] += d.upper[k] || 0)
        );
      }

      if (d.lower) {
        Object.keys(sum_lower).forEach(
          (k) => (sum_lower[k] += d.lower[k] || 0)
        );
      }

      sum_angle += d.knee_angle || 0;

      if (d.temperature) {
        sum_temp.ambient += d.temperature.ambient || 0;
        sum_temp.object += d.temperature.object || 0;
      }

      if (d.microphone) {
        sum_mic.rms += d.microphone.rms || 0;
        sum_mic.peak += d.microphone.peak || 0;
        sum_mic.energy += d.microphone.energy || 0;
        micCount++;
      }
    });

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

      avg_microphone:
        micCount > 0
          ? {
              rms: sum_mic.rms / micCount,
              peak: sum_mic.peak / micCount,
              energy: sum_mic.energy / micCount,
            }
          : undefined,
    });

    await avgData.save();
    await RawSensorData.deleteMany({
      _id: { $in: rawData.map((d) => d._id) },
    });

    console.log(`✅ 5-min AVG saved (${count} samples)`);
  } catch (err) {
    console.error("5-min average error:", err.message);
  }
}, 5 * 60 * 1000);

/* ================= FILTERED AVG DATA ================= */
router.get("/api/sensor-datas", async (req, res) => {
  try {
    const { deviceId, range } = req.query;
    if (!deviceId) {
      return res.status(400).json({ error: "Missing deviceId" });
    }

    const days = parseInt(range, 10) || 7;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const data = await AvgSensorData.find({
      device_id: deviceId,
      createdAt: { $gte: startDate },
    }).sort({ createdAt: 1 });

    if (!data.length) {
      return res.status(404).json({ error: "No data found" });
    }

    res.json(data);
  } catch (err) {
    console.error("get filtered avg sensor-data error:", err.message);
    res.status(500).json({ error: "Failed to fetch filtered sensor data" });
  }
});

module.exports = router;
