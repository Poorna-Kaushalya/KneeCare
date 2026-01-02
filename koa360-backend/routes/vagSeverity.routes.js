const express = require("express");
const path = require("path");
const { spawn } = require("child_process");
const AvgSensorData = require("../models/AvgSensorData");

const router = express.Router();

/**
 * GET /api/vag/severity/:deviceId?days=14&source=piezo
 */
router.get("/api/vag/severity/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    const days = Number(req.query.days || 14);
    const source = (req.query.source || "piezo").toLowerCase();

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await AvgSensorData.find(
      { device_id: deviceId, createdAt: { $gte: since } },
      {
        "avg_piezo.voltage": 1,
        "avg_upper.ax": 1, "avg_upper.ay": 1, "avg_upper.az": 1,
        "avg_upper.gx": 1, "avg_upper.gy": 1, "avg_upper.gz": 1,
        "avg_lower.ax": 1, "avg_lower.ay": 1, "avg_lower.az": 1,
        "avg_lower.gx": 1, "avg_lower.gy": 1, "avg_lower.gz": 1,
        avg_knee_angle: 1,
        "avg_temperature.object": 1,
        createdAt: 1
      }
    ).sort({ createdAt: 1 });

    if (!rows.length) {
      return res.status(404).json({ error: "No sensor data found for this device in selected period." });
    }

    const knee_temp_series = rows
      .map(r => r?.avg_temperature?.object)
      .filter(v => typeof v === "number" && Number.isFinite(v));

    const signal_series = [];

    for (const r of rows) {
      let v = null;

      if (source === "piezo") {
        v = r?.avg_piezo?.voltage;
      } else if (source === "upper_acc") {
        const ax = r?.avg_upper?.ax, ay = r?.avg_upper?.ay, az = r?.avg_upper?.az;
        if ([ax, ay, az].every(n => typeof n === "number" && Number.isFinite(n))) {
          v = Math.sqrt(ax*ax + ay*ay + az*az);
        }
      } else if (source === "lower_acc") {
        const ax = r?.avg_lower?.ax, ay = r?.avg_lower?.ay, az = r?.avg_lower?.az;
        if ([ax, ay, az].every(n => typeof n === "number" && Number.isFinite(n))) {
          v = Math.sqrt(ax*ax + ay*ay + az*az);
        }
      } else if (source === "upper_gyro") {
        const gx = r?.avg_upper?.gx, gy = r?.avg_upper?.gy, gz = r?.avg_upper?.gz;
        if ([gx, gy, gz].every(n => typeof n === "number" && Number.isFinite(n))) {
          v = Math.sqrt(gx*gx + gy*gy + gz*gz);
        }
      } else if (source === "lower_gyro") {
        const gx = r?.avg_lower?.gx, gy = r?.avg_lower?.gy, gz = r?.avg_lower?.gz;
        if ([gx, gy, gz].every(n => typeof n === "number" && Number.isFinite(n))) {
          v = Math.sqrt(gx*gx + gy*gy + gz*gz);
        }
      } else if (source === "knee_angle") {
        v = r?.avg_knee_angle;
      }

      if (typeof v === "number" && Number.isFinite(v)) signal_series.push(v);
    }

    if (signal_series.length < 10) {
      return res.status(400).json({
        error: "Not enough signal points to compute FFT features (need at least ~10).",
        rows: rows.length,
        signal_points: signal_series.length
      });
    }

    // ✅ run python from venv
    const pythonExe = path.join(__dirname, "..", "pyenv", "Scripts", "python.exe");
    const scriptPath = path.join("python", "predict_vag_severity.py");

    const py = spawn(pythonExe, [scriptPath], { cwd: path.join(__dirname, "..") });

    py.stdin.write(JSON.stringify({ signal_series, knee_temp_series }));
    py.stdin.end();

    let out = "";
    let err = "";
    py.stdout.on("data", d => out += d.toString());
    py.stderr.on("data", d => err += d.toString());

    py.on("close", () => {
      if (err) return res.status(500).json({ error: err });

      let data;
      try { data = JSON.parse(out); }
      catch {
        return res.status(500).json({ error: "Python returned invalid JSON", raw: out });
      }

      return res.json({
        device_id: deviceId,
        period_days: days,
        source,
        records_used: rows.length,
        signal_points_used: signal_series.length,
        severity_level: data.prediction,
        confidence: data.confidence ?? null,
        computed_features: data.features_used
      });
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
