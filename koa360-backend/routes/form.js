const express = require("express");
const fftjs = require("fft-js"); // ✅ functional API
const { fft, util } = fftjs;
const RawSensorData = require("../models/RawSensorData");
const FormData = require("../models/FormData");

const router = express.Router();

// === Helper Functions ===
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
    if ((x[i - 1] >= 0 && x[i] < 0) || (x[i - 1] < 0 && x[i] >= 0)) crossings++;
  }
  return crossings * (sampleRate / (x.length - 1));
}

// === Core Feature Extraction ===
function featuresFromSignal(sig, sampleRate) {
  const n = sig.length;
  if (n < 8 || sampleRate <= 0) {
    return {
      rms_amplitude: 0,
      peak_frequency: 0,
      spectral_entropy: 0,
      zero_crossing_rate: 0,
      mean_frequency: 0,
    };
  }

  // --- Time-domain features ---
  const rms = Math.sqrt(sig.reduce((s, v) => s + v * v, 0) / n);
  const zcr = zeroCrossingsPerSecond(sig, sampleRate);

  // --- Frequency-domain (FFT) ---
  const x = centerAndWindow(sig);

  // ✅ Ensure valid FFT length (nearest lower power of 2)
  let pow2 = 1;
  while (pow2 * 2 <= x.length) pow2 *= 2;
  if (pow2 < 8) pow2 = 8;

  // ✅ Trim or zero-pad to power-of-2 length
  let data = x.slice(0, pow2);
  if (data.length < pow2) {
    const pad = new Array(pow2 - data.length).fill(0);
    data = data.concat(pad);
  }

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
  const power = mags.slice(0, half).map((m) => m * m);
  const powerSum = power.reduce((a, b) => a + b, 0);

  if (powerSum === 0) {
    return {
      rms_amplitude: rms,
      peak_frequency: 0,
      spectral_entropy: 0,
      zero_crossing_rate: zcr,
      mean_frequency: 0,
    };
  }

  const df = sampleRate / data.length;
  let peakK = 0,
    peakP = -1,
    freqWeighted = 0;
  const probs = new Array(half);

  for (let k = 0; k < half; k++) {
    const f = k * df;
    const pk = power[k];
    if (pk > peakP) {
      peakP = pk;
      peakK = k;
    }
    freqWeighted += f * pk;
    probs[k] = pk / powerSum;
  }

  const peakFreq = peakK * df;
  const meanFreq = freqWeighted / powerSum;

  // --- Spectral entropy ---
  let H = 0;
  for (let k = 1; k < half; k++) {
    const p = probs[k];
    if (p > 0) H += -p * Math.log2(p);
  }
  const Hmax = Math.log2(Math.max(half - 1, 1));
  const sent = Hmax > 0 ? H / Hmax : 0;

  return {
    rms_amplitude: rms,
    peak_frequency: Number(peakFreq.toFixed(3)),
    spectral_entropy: Number(sent.toFixed(4)),
    zero_crossing_rate: Number(zcr.toFixed(3)),
    mean_frequency: Number(meanFreq.toFixed(3)),
  };
}

// === API ROUTES ===

// ✅ GET features for last 5 minutes
router.get("/api/features", async (req, res) => {
  try {
    const { device_id } = req.query;
    if (!device_id) return res.status(400).json({ error: "device_id is required" });

    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - 5 * 60 * 1000);

    const rows = await RawSensorData.find({
      device_id,
      createdAt: { $gte: windowStart, $lte: windowEnd },
    })
      .sort({ createdAt: 1 })
      .lean();

    if (!rows.length) {
      return res.json({ ok: true, hasData: false, message: "No raw data in last 5 minutes." });
    }

    const series = rows.map((r) => Number(r.knee_angle || 0));
    const seconds = (rows[rows.length - 1].createdAt - rows[0].createdAt) / 1000 || 1;
    const sampleRate = Math.max(1, Math.round(rows.length / seconds));

    const feats = featuresFromSignal(series, sampleRate);

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

// ✅ POST: save user-labeled form data
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
      return res.status(400).json({ error: "device_id, windowStart, windowEnd are required" });
    }
    if (!knee_condition || !severity_level || !treatment_advised) {
      return res.status(400).json({ error: "form selections are required" });
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

// ✅ GET: list recent form data
router.get("/api/formdata", async (req, res) => {
  const { device_id, limit = 10 } = req.query;
  const q = device_id ? { device_id } : {};
  const rows = await FormData.find(q).sort({ createdAt: -1 }).limit(Number(limit));
  res.json(rows);
});

module.exports = router;
