const express = require("express");
const path = require("path");
const { spawn } = require("child_process");
const AvgSensorData = require("../models/AvgSensorData");

const router = express.Router();

function monthLabel(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function avg(nums) {
  const valid = nums.filter((n) => typeof n === "number" && Number.isFinite(n));
  if (!valid.length) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

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
      } catch (e) {
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

// GET latest + monthly prediction using AvgSensorData feature fields
router.get("/api/vag/avgdata-predictions/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    const months = Number(req.query.months || 6);

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const rows = await AvgSensorData.find({
      device_id: deviceId,
      createdAt: { $gte: since },
    }).sort({ createdAt: 1 });

    if (!rows.length) {
      return res.status(404).json({
        error: "No AvgSensorData found for this device in selected period.",
      });
    }

    // latest valid row
    const latestValidRow = [...rows].reverse().find((row) => extractPredictionFeatures(row));

    let latestPrediction = null;

    if (latestValidRow) {
      const latestFeatures = extractPredictionFeatures(latestValidRow);
      const latestPy = await runPythonPrediction(latestFeatures);

      latestPrediction = {
        _id: latestValidRow._id,
        device_id: latestValidRow.device_id,
        createdAt: latestValidRow.createdAt,
        updatedAt: latestValidRow.updatedAt,
        severity_level: normalizeSeverityLabel(latestPy.prediction),
        severity_score: severityToScore(latestPy.prediction),
        confidence: latestPy.confidence ?? null,
        features_used: latestFeatures,
        raw_avgdata: latestValidRow,
      };
    }

    // group by month
    const grouped = {};
    for (const row of rows) {
      const dt = new Date(row.createdAt);
      const year = dt.getFullYear();
      const month = dt.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!grouped[key]) {
        grouped[key] = {
          year,
          month,
          month_label: monthLabel(year, month),
          rows: [],
        };
      }

      grouped[key].rows.push(row);
    }

    const monthlyPredictions = [];

    for (const key of Object.keys(grouped).sort((a, b) => {
      const [ay, am] = a.split("-").map(Number);
      const [by, bm] = b.split("-").map(Number);
      if (ay !== by) return ay - by;
      return am - bm;
    })) {
      const group = grouped[key];
      const validRows = group.rows
        .map((r) => ({
          row: r,
          features: extractPredictionFeatures(r),
        }))
        .filter((x) => x.features !== null);

      if (!validRows.length) continue;

      const monthlyFeatures = {
        rms_amplitude: avg(validRows.map((x) => x.features.rms_amplitude)),
        spectral_entropy: avg(validRows.map((x) => x.features.spectral_entropy)),
        zero_crossing_rate: avg(validRows.map((x) => x.features.zero_crossing_rate)),
        mean_frequency: avg(validRows.map((x) => x.features.mean_frequency)),
        knee_tempurarture: avg(validRows.map((x) => x.features.knee_tempurarture)),
      };

      const py = await runPythonPrediction(monthlyFeatures);

      monthlyPredictions.push({
        device_id: deviceId,
        year: group.year,
        month: group.month,
        month_label: group.month_label,
        severity_level: normalizeSeverityLabel(py.prediction),
        severity_score: severityToScore(py.prediction),
        confidence: py.confidence ?? null,
        records_used: validRows.length,
        features_used: monthlyFeatures,
      });
    }

    return res.json({
      device_id: deviceId,
      months_requested: months,
      records_found: rows.length,
      latest_prediction: latestPrediction,
      monthly_predictions: monthlyPredictions,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;