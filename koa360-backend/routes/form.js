// routes/form.js
const express = require("express");
const fftjs = require("fft-js"); // functional API
const { fft, util } = fftjs;
const RawSensorData = require("../models/RawSensorData");
const FormData = require("../models/FormData");

const router = express.Router();

/* =========================
 * Helper Functions
 * ========================= */
function hannWindow(n) {
  const w = new Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
  return w;
}

function centerAndWindow(x) {
  const n = x.length;
  if (n === 0) return x;
  const mean = x.reduce((s, v) => s + v, 0) / n;
  const w = hannWindow(n);
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = (x[i] - mean) * w[i];
  return out;
}

function zeroCrossingsPerSecond(x, sampleRate) {
  if (x.length < 2) return 0;
  let crossings = 0;
  for (let i = 1; i < x.length; i++) {
    const prev = x[i - 1];
    const cur = x[i];
    if ((prev >= 0 && cur < 0) || (prev < 0 && cur >= 0)) crossings++;
  }
  // normalize to per-second
  return crossings * (sampleRate / Math.max(1, x.length - 1));
}

/**
 * Compute frequency-domain features using FFT with windowing and power-of-2 length.
 * entropyMode: 'normalized' (0..1) or 'kaggle_raw' (big negative values, sum of log power)
 */
function featuresFromSignal(sig, sampleRate, entropyMode = "normalized") {
  const n = sig.length;
  if (n < 8 || sampleRate <= 0 || !isFinite(sampleRate)) {
    return {
      rms_amplitude: 0,
      peak_frequency: 0,
      spectral_entropy: 0,
      zero_crossing_rate: 0,
      mean_frequency: 0,
    };
  }

  // --- Time-domain ---
  const mean = sig.reduce((s, v) => s + v, 0) / n;
  const centered = sig.map((v) => v - mean);
  const rms = Math.sqrt(centered.reduce((s, v) => s + v * v, 0) / n);
  const zcr = zeroCrossingsPerSecond(centered, sampleRate);

  // --- Window + FFT (power-of-2 safe) ---
  const x = centerAndWindow(sig);
  let pow2 = 1;
  while (pow2 * 2 <= x.length) pow2 *= 2;
  if (pow2 < 8) pow2 = 8;

  let data = x.slice(0, pow2);
  if (data.length < pow2) data = data.concat(new Array(pow2 - data.length).fill(0));

  let phasors;
  try {
    phasors = fft(data);
  } catch (err) {
    console.error("FFT computation error:", err.message);
    return {
      rms_amplitude: rms,
      peak_frequency: 0,
      spectral_entropy: 0,
      zero_crossing_rate: zcr,
      mean_frequency: 0,
    };
  }

  const mags = util.fftMag(phasors);
  const half = Math.floor(mags.length / 2);

  // Single-sided power spectrum
  const power = new Array(half);
  let powerSum = 0;
  for (let k = 0; k < half; k++) {
    const p = mags[k] * mags[k];
    power[k] = p;
    powerSum += p;
  }
  if (!isFinite(powerSum) || powerSum <= 0) {
    return {
      rms_amplitude: rms,
      peak_frequency: 0,
      spectral_entropy: 0,
      zero_crossing_rate: zcr,
      mean_frequency: 0,
    };
  }

  // Frequency resolution (Hz per bin)
  const df = sampleRate / data.length;

  // Peak & mean frequency
  let peakK = 0,
    peakP = -1,
    freqWeighted = 0;
  for (let k = 0; k < half; k++) {
    const pk = power[k];
    if (pk > peakP) {
      peakP = pk;
      peakK = k;
    }
    freqWeighted += (k * df) * pk;
  }
  const peakFreq = peakK * df;
  const meanFreq = freqWeighted / powerSum;

  // Spectral entropy
  let spectral_entropy;
  if (entropyMode === "kaggle_raw") {
    // Kaggle-like: sum log(power + eps), will be large negative
    const eps = 1e-12;
    let H = 0;
    for (let k = 1; k < half; k++) {
      H += Math.log(power[k] + eps); // natural log
    }
    spectral_entropy = H;
  } else {
    // Normalized Shannon entropy (0..1)
    let H = 0;
    for (let k = 1; k < half; k++) {
      const p = power[k] / powerSum;
      if (p > 0) H += -p * Math.log2(p);
    }
    const Hmax = Math.log2(Math.max(half - 1, 1));
    spectral_entropy = Hmax > 0 ? H / Hmax : 0;
  }

  return {
    rms_amplitude: Number(rms.toFixed(6)),
    peak_frequency: Number(peakFreq.toFixed(3)),
    spectral_entropy: Number(
      spectral_entropy.toFixed(entropyMode === "kaggle_raw" ? 3 : 4)
    ),
    zero_crossing_rate: Number(zcr.toFixed(3)),
    mean_frequency: Number(meanFreq.toFixed(3)),
  };
}

/* =========================
 * API ROUTES
 * ========================= */

/**
 * GET /api/features
 * Query params:
 *  - device_id=KOA360-001  (required)
 *  - signal=accel|knee     (default: accel)
 *  - entropy=normalized|kaggle (default: normalized)
 *  - g2ms2=9.80665         (optional, only used when signal=accel)
 */
router.get("/api/features", async (req, res) => {
  try {
    const {
      device_id,
      signal = "accel",
      entropy = "normalized",
      g2ms2: g2ms2Raw,
    } = req.query;

    if (!device_id) {
      return res.status(400).json({ error: "device_id is required" });
    }

    // 5-minute window
    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - 5 * 60 * 1000);

    const rows = await RawSensorData.find({
      device_id,
      createdAt: { $gte: windowStart, $lte: windowEnd },
    })
      .sort({ createdAt: 1 })
      .lean();

    if (!rows.length) {
      return res.json({
        ok: true,
        hasData: false,
        message: "No raw data in last 5 minutes.",
      });
    }

    // Choose signal series
    let series;
    if (signal === "knee") {
      // knee_angle (already in degrees or radians depending on firmware)
      series = rows.map((r) => Number(r.knee_angle || 0));
    } else {
      // Acceleration magnitude (upper + lower)
      // If your IMU raw accel is in g, set g2ms2 to 9.80665 to convert to m/s^2
      const g2ms2 = g2ms2Raw ? Number(g2ms2Raw) : 1; // default no scaling
      series = rows.map((r) => {
        const ux = Number(r?.upper?.ax || 0),
          uy = Number(r?.upper?.ay || 0),
          uz = Number(r?.upper?.az || 0);
        const lx = Number(r?.lower?.ax || 0),
          ly = Number(r?.lower?.ay || 0),
          lz = Number(r?.lower?.az || 0);
        const umag = Math.sqrt(ux * ux + uy * uy + uz * uz) * g2ms2;
        const lmag = Math.sqrt(lx * lx + ly * ly + lz * lz) * g2ms2;
        // You can choose umag, lmag, or a composite. Here we sum.
        return umag + lmag;
      });
    }

    // Estimate sample rate (samples per second)
    const seconds =
      (new Date(rows[rows.length - 1].createdAt) - new Date(rows[0].createdAt)) /
        1000 || 1;
    const sampleRate = Math.max(1, Math.round(rows.length / seconds));

    const feats = featuresFromSignal(
      series,
      sampleRate,
      entropy === "kaggle" ? "kaggle_raw" : "normalized"
    );

    return res.json({
      ok: true,
      hasData: true,
      device_id,
      windowStart,
      windowEnd,
      sampleRateHz: sampleRate,
      ...feats,
    });
  } catch (e) {
    console.error("features error:", e);
    res.status(500).json({ error: "Failed to compute features" });
  }
});

/**
 * POST /api/formdata
 * Body:
 *  {
 *    device_id, windowStart, windowEnd, sampleRateHz,
 *    rms_amplitude, peak_frequency, spectral_entropy, zero_crossing_rate, mean_frequency,
 *    knee_condition, severity_level, treatment_advised, notes
 *  }
 */
router.post("/api/formdata", async (req, res) => {
  try {
    const {
      device_id,
      windowStart,
      windowEnd,
      sampleRateHz,
      rms_amplitude,
      peak_frequency,
      spectral_entropy,
      zero_crossing_rate,
      mean_frequency,
      knee_condition,
      severity_level,
      treatment_advised,
      notes,
    } = req.body;

    if (!device_id || !windowStart || !windowEnd) {
      return res
        .status(400)
        .json({ error: "device_id, windowStart, windowEnd are required" });
    }
    if (!knee_condition || !severity_level || !treatment_advised) {
      return res
        .status(400)
        .json({ error: "form selections are required" });
    }

    const doc = await FormData.create({
      device_id,
      features: {
        windowStart,
        windowEnd,
        sampleRateHz,
        rms_amplitude,
        peak_frequency,
        spectral_entropy,
        zero_crossing_rate,
        mean_frequency,
      },
      knee_condition,
      severity_level,
      treatment_advised,
      notes,
    });

    res.json({ ok: true, id: doc._id });
  } catch (e) {
    console.error("formdata save error:", e.message);
    res.status(500).json({ error: "Failed to save formdata" });
  }
});

/**
 * GET /api/formdata
 * Query: device_id (optional), limit (default 10)
 */
router.get("/api/formdata", async (req, res) => {
  try {
    const { device_id, limit = 10 } = req.query;
    const q = device_id ? { device_id } : {};
    const rows = await FormData.find(q)
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json(rows);
  } catch (e) {
    console.error("formdata list error:", e);
    res.status(500).json({ error: "Failed to list formdata" });
  }
});

module.exports = router;
