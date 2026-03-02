const express = require("express");
const path = require("path");
const { spawn } = require("child_process");
const AvgSensorData = require("../models/AvgSensorData");

const router = express.Router();

router.get("/api/vag/severity/latest/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    // ✅ latest record
    const row = await AvgSensorData.findOne({ device_id: deviceId }).sort({ createdAt: -1 });

    if (!row) {
      return res.status(404).json({ error: "No sensor data found for this device." });
    }

    const aligned = row?.avg_microphone_features_aligned || {};

    const rms_amplitude = aligned?.rms_amplitude;
    const spectral_entropy = aligned?.spectral_entropy;
    const zero_crossing_rate = aligned?.zero_crossing_rate;
    const mean_frequency = aligned?.mean_frequency;
    const avg_knee_tempurarture = row?.avg_knee_tempurarture;

    const vals = [
      rms_amplitude,
      spectral_entropy,
      zero_crossing_rate,
      mean_frequency,
      avg_knee_tempurarture,
    ];

    if (
      vals.some(
        (v) => v === undefined || v === null || v === "" || Number.isNaN(Number(v))
      )
    ) {
      return res.status(400).json({
        error: "Latest record missing required aligned features.",
        latest_record_id: String(row?._id),
      });
    }

    const pythonExe =
      process.platform === "win32"
        ? path.join(__dirname, "..", "pyenv", "Scripts", "python.exe")
        : "python3";

    const scriptPath = path.join(__dirname, "..", "python", "predict_vag_severity.py");
    const cwd = path.join(__dirname, "..");

    const py = spawn(pythonExe, [scriptPath], { cwd });

    py.stdin.write(
      JSON.stringify({
        _id: String(row._id),
        device_id: row.device_id,
        avg_microphone_features_aligned: {
          rms_amplitude: Number(rms_amplitude),
          spectral_entropy: Number(spectral_entropy),
          zero_crossing_rate: Number(zero_crossing_rate),
          mean_frequency: Number(mean_frequency),
        },
        avg_knee_tempurarture: Number(avg_knee_tempurarture),
      })
    );
    py.stdin.end();

    let out = "";
    let err = "";

    py.stdout.on("data", (d) => (out += d.toString()));
    py.stderr.on("data", (d) => (err += d.toString()));

    py.on("close", (code) => {
      if (code !== 0) {
        return res.status(500).json({
          error: "Python process failed",
          exitCode: code,
          stderr: err || null,
          stdout: out || null,
        });
      }

      let data;
      try {
        data = JSON.parse((out || "").trim());
      } catch {
        return res.status(500).json({ error: "Python returned invalid JSON", raw: out, stderr: err });
      }

      return res.json({
        device_id: deviceId,
        latest_record_id: String(row._id),
        latest_createdAt: row.createdAt,
        severity_level: data.prediction,
        confidence: data.confidence ?? null,
        features_used: data.features_used,
      });
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;