const express = require("express");
const path = require("path");
const { spawn } = require("child_process");

const router = express.Router();

/**
 * POST /api/vag/severity-from-features
 * body: { rms_amplitude, spectral_entropy, zero_crossing_rate, mean_frequency, knee_tempurarture }
 */
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

    if (vals.some(v => v === undefined || v === null || v === "" || Number.isNaN(Number(v)))) {
      return res.status(400).json({ error: "Missing or invalid feature values." });
    }

    const pythonExe = path.join(__dirname, "..", "pyenv", "Scripts", "python.exe");
    const scriptPath = path.join("python", "predict_vag_from_features.py");

    const py = spawn(pythonExe, [scriptPath], { cwd: path.join(__dirname, "..") });

    py.stdin.write(JSON.stringify({
      rms_amplitude: Number(rms_amplitude),
      spectral_entropy: Number(spectral_entropy),
      zero_crossing_rate: Number(zero_crossing_rate),
      mean_frequency: Number(mean_frequency),
      knee_tempurarture: Number(knee_tempurarture),
    }));
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

      return res.json(data);
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
