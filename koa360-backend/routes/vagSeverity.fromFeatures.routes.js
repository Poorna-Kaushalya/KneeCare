const express = require("express");
const path = require("path");
const { spawn } = require("child_process");

const router = express.Router();

router.post("/api/vag/severity-from-features", async (req, res) => {
  try {
    const {
      rms_amplitude,
      spectral_entropy,
      zero_crossing_rate,
      mean_frequency,
      knee_tempurarture,
    } = req.body || {};

    const vals = [
      rms_amplitude,
      spectral_entropy,
      zero_crossing_rate,
      mean_frequency,
      knee_tempurarture,
    ];

    if (
      vals.some(
        (v) =>
          v === undefined || v === null || v === "" || Number.isNaN(Number(v))
      )
    ) {
      return res.status(400).json({ error: "Missing or invalid feature values." });
    }

    const pythonExe =
      process.platform === "win32"
        ? path.join(__dirname, "..", "pyenv", "Scripts", "python.exe")
        : "python3";

    const scriptPath = path.join(__dirname, "..", "python", "predict_vag_from_features.py");
    const cwd = path.join(__dirname, "..");

    const py = spawn(pythonExe, [scriptPath], { cwd });

    py.stdin.write(
      JSON.stringify({
        rms_amplitude: Number(rms_amplitude),
        spectral_entropy: Number(spectral_entropy),
        zero_crossing_rate: Number(zero_crossing_rate),
        mean_frequency: Number(mean_frequency),
        knee_tempurarture: Number(knee_tempurarture),
      })
    );
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
        return res.status(500).json({
          error: "Python returned invalid JSON",
          raw: out,
          stderr: err || null,
        });
      }

      return res.json(data);
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;