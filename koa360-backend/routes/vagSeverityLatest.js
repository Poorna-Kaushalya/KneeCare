const express = require("express");
const path = require("path");
const { spawn } = require("child_process");
const AvgSensorData = require("../models/AvgSensorData");

const router = express.Router();

function normalizeSeverityLabel(label) {
  const v = String(label || "").trim().toLowerCase();

  if (["normal", "kl0", "0"].includes(v)) return "Normal";
  if (["mild", "kl1", "1"].includes(v)) return "Mild";
  if (["moderate", "kl2", "2"].includes(v)) return "Moderate";
  if (["severe", "kl3", "kl4", "3", "4"].includes(v)) return "Severe";

  return label || "Unknown";
}

function severityToScore(label) {
  const v = normalizeSeverityLabel(label);
  if (v === "Normal") return 1;
  if (v === "Mild") return 2;
  if (v === "Moderate") return 3;
  if (v === "Severe") return 4;
  return 1;
}

function extractPredictionFeatures(row) {
  const aligned = row?.avg_microphone_features_aligned || {};

  const features = {
    rms_amplitude: aligned.rms_amplitude,
    spectral_entropy: aligned.spectral_entropy,
    zero_crossing_rate: aligned.zero_crossing_rate,
    mean_frequency: aligned.mean_frequency,
    knee_tempurarture: row?.avg_knee_tempurarture,
  };

  const isValid = Object.values(features).every(
    (v) => typeof v === "number" && Number.isFinite(v)
  );

  return isValid ? features : null;
}

function runPythonPrediction(features) {
  return new Promise((resolve, reject) => {
    const pythonExe =
      process.platform === "win32"
        ? path.join(__dirname, "..", "pyenv", "Scripts", "python.exe")
        : "python3";

    const scriptPath = path.join(
      __dirname,
      "..",
      "python",
      "predict_vag_from_features.py"
    );

    const cwd = path.join(__dirname, "..");

    const py = spawn(pythonExe, [scriptPath], { cwd });

    let out = "";
    let err = "";

    py.stdout.on("data", (d) => {
      out += d.toString();
    });

    py.stderr.on("data", (d) => {
      err += d.toString();
    });

    py.on("error", (spawnErr) => {
      reject(
        new Error(
          `Failed to start Python process: ${spawnErr.message} | pythonExe=${pythonExe} | scriptPath=${scriptPath}`
        )
      );
    });

    py.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `Python process failed (exit ${code}). stderr=${err || "none"} stdout=${out || "none"}`
          )
        );
        return;
      }

      try {
        const parsed = JSON.parse((out || "").trim());
        resolve(parsed);
      } catch {
        reject(
          new Error(
            `Python returned invalid JSON. raw=${out || "empty"} stderr=${err || "none"}`
          )
        );
      }
    });

    py.stdin.write(JSON.stringify(features));
    py.stdin.end();
  });
}

// GET latest AvgSensorData row and predict severity using model
router.get("/api/latest-avg-severity/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    const rows = await AvgSensorData.find({
      device_id: deviceId,
    }).sort({ createdAt: -1 });

    if (!rows.length) {
      return res.status(404).json({
        error: "No AvgSensorData found for this device.",
      });
    }

    const latestValidRow = rows.find((row) => extractPredictionFeatures(row));

    if (!latestValidRow) {
      return res.status(404).json({
        error: "No valid AvgSensorData row found with required prediction features.",
      });
    }

    const features = extractPredictionFeatures(latestValidRow);
    const py = await runPythonPrediction(features);

    return res.json({
      success: true,
      prediction: {
        _id: latestValidRow._id,
        device_id: latestValidRow.device_id,
        createdAt: latestValidRow.createdAt,
        updatedAt: latestValidRow.updatedAt,
        severity_level: normalizeSeverityLabel(py.prediction),
        severity_score: severityToScore(py.prediction),
        confidence: py.confidence ?? null,
        features_used: features,
        raw_avgdata: latestValidRow,
      },
    });
  } catch (err) {
    console.error("latest avg severity error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;