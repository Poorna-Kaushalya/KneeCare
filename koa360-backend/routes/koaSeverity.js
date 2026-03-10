const express = require("express");
const path = require("path");
const { spawn } = require("child_process");
const AvgSensorData = require("../models/AvgSensorData");

const router = express.Router();

router.get("/api/koa-severity", async (req, res) => {
  try {
    const deviceId = req.query.deviceId;
    const days = Number(req.query.days || 14);
    const source = String(req.query.source || "piezo").toLowerCase();

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows = await AvgSensorData.find(
      { device_id: deviceId, createdAt: { $gte: since } },
      {
        "avg_piezo.raw": 1,
        "avg_piezo.voltage": 1,
        "avg_piezo.trigger_rate": 1,

        "avg_upper.ax": 1,
        "avg_upper.ay": 1,
        "avg_upper.az": 1,
        "avg_upper.gx": 1,
        "avg_upper.gy": 1,
        "avg_upper.gz": 1,

        "avg_lower.ax": 1,
        "avg_lower.ay": 1,
        "avg_lower.az": 1,
        "avg_lower.gx": 1,
        "avg_lower.gy": 1,
        "avg_lower.gz": 1,

        avg_knee_angle: 1,
        "avg_temperature.object": 1,
        createdAt: 1,
      }
    ).sort({ createdAt: 1 });

    if (!rows.length) {
      return res.status(404).json({
        error: "No sensor data found for this device in selected period.",
      });
    }

    const knee_temp_series = rows
      .map((r) => r?.avg_temperature?.object)
      .filter((v) => typeof v === "number" && Number.isFinite(v));

    const signal_series = [];
    for (const r of rows) {
      let v = null;

      switch (source) {
        case "piezo":
          v = r?.avg_piezo?.voltage ?? r?.avg_piezo?.raw;
          break;

        case "upper_acc": {
          const { ax, ay, az } = r?.avg_upper ?? {};
          if (
            [ax, ay, az].every(
              (n) => typeof n === "number" && Number.isFinite(n)
            )
          ) {
            v = Math.sqrt(ax * ax + ay * ay + az * az);
          }
          break;
        }

        case "lower_acc": {
          const { ax, ay, az } = r?.avg_lower ?? {};
          if (
            [ax, ay, az].every(
              (n) => typeof n === "number" && Number.isFinite(n)
            )
          ) {
            v = Math.sqrt(ax * ax + ay * ay + az * az);
          }
          break;
        }

        case "upper_gyro": {
          const { gx, gy, gz } = r?.avg_upper ?? {};
          if (
            [gx, gy, gz].every(
              (n) => typeof n === "number" && Number.isFinite(n)
            )
          ) {
            v = Math.sqrt(gx * gx + gy * gy + gz * gz);
          }
          break;
        }

        case "lower_gyro": {
          const { gx, gy, gz } = r?.avg_lower ?? {};
          if (
            [gx, gy, gz].every(
              (n) => typeof n === "number" && Number.isFinite(n)
            )
          ) {
            v = Math.sqrt(gx * gx + gy * gy + gz * gz);
          }
          break;
        }

        case "knee_angle":
          v = r?.avg_knee_angle;
          break;

        default:
          v = r?.avg_piezo?.voltage ?? r?.avg_piezo?.raw;
      }

      if (typeof v === "number" && Number.isFinite(v)) {
        signal_series.push(v);
      }
    }

    if (signal_series.length < 10) {
      return res.status(400).json({
        error:
          "Not enough signal points to compute FFT features (need at least ~10).",
        records_used: rows.length,
        signal_points_used: signal_series.length,
      });
    }

    //  Always use python inside venv (Windows-safe)
    const pythonExe =
      process.platform === "win32"
        ? path.join(__dirname, "..", "pyenv", "Scripts", "python.exe")
        : "python3";

    const scriptPath = path.join(
      __dirname,
      "..",
      "python",
      "predict_vag_severity.py"
    );

    // python process to run prediction
    const cwd = path.join(__dirname, "..");

    const py = spawn(pythonExe, [scriptPath], { cwd });

    // Send input to python
    py.stdin.write(JSON.stringify({ signal_series, knee_temp_series }));
    py.stdin.end();

    let out = "";
    let err = "";

    py.stdout.on("data", (d) => (out += d.toString()));
    py.stderr.on("data", (d) => (err += d.toString()));

    py.on("error", (spawnErr) => {
      return res.status(500).json({
        error: "Failed to start Python process",
        details: spawnErr.message,
        pythonExe,
        scriptPath,
      });
    });

    py.on("close", (code) => {
      //  If python crashed, return full debug info
      if (code !== 0) {
        return res.status(500).json({
          error: "Python process failed",
          exitCode: code,
          stderr: err || null,
          stdout: out || null,
          pythonExe,
          scriptPath,
          cwd,
        });
      }

      let data;
      try {
        data = JSON.parse(out);
      } catch {
        return res.status(500).json({
          error: "Python returned invalid JSON",
          raw: out,
          stderr: err || null,
        });
      }

      const from = rows[0]?.createdAt;
      const to = rows[rows.length - 1]?.createdAt;

      return res.json({
        severity: data.prediction,
        confidence: data.confidence ?? null,
        deviceId,
        windowDays: days,
        from,
        to,
        source,
        records_used: rows.length,
        signal_points_used: signal_series.length,
        features: data.features_used ?? null,
      });
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;