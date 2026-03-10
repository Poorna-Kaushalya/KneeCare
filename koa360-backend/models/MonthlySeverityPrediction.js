const mongoose = require("mongoose");

const MonthlySeverityPredictionSchema = new mongoose.Schema(
  {
    device_id: { type: String, required: true, index: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true }, // 1-12

    month_label: { type: String, required: true }, // e.g. "2026-02"

    from_date: { type: Date, required: true },
    to_date: { type: Date, required: true },

    records_used: { type: Number, default: 0 },

    features_used: {
      rms_amplitude: Number,
      spectral_entropy: Number,
      zero_crossing_rate: Number,
      mean_frequency: Number,
      knee_tempurarture: Number,
    },

    severity_level: { type: String, required: true },
    severity_score: { type: Number, default: 0 },
    confidence: { type: Number, default: null },
  },
  { timestamps: true }
);

MonthlySeverityPredictionSchema.index(
  { device_id: 1, year: 1, month: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "MonthlySeverityPrediction",
  MonthlySeverityPredictionSchema
);