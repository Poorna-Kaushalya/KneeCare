const mongoose = require("mongoose");

function parseDateString(dateStr) {
  if (!dateStr) return null;
  const [datePart, timePart] = dateStr.split(",").map((s) => s.trim());
  if (!datePart || !timePart) return null;
  const [day, month, year] = datePart.split("/").map(Number);
  const [hours, minutes, seconds] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

const FeatureSchema = new mongoose.Schema({
  windowStart: {
    type: Date,
    required: true,
    set: (val) => (val instanceof Date ? val : parseDateString(val)),
  },
  windowEnd: {
    type: Date,
    required: true,
    set: (val) => (val instanceof Date ? val : parseDateString(val)),
  },
  sampleRateHz: { type: Number, required: true },

  rms_amplitude: { type: Number, required: true },
  peak_frequency: { type: Number, required: true },
  spectral_entropy: { type: Number, required: true },
  zero_crossing_rate: { type: Number, required: true },
  mean_frequency: { type: Number, required: true },
  temperature: { type: Number, required: true },
}, { _id: false });

const FormDataSchema = new mongoose.Schema({
  device_id: { type: String, required: true, index: true },
  features: { type: FeatureSchema, required: true },

  knee_condition: {
    type: String,
    enum: ["normal", "osteoarthritis", "ligament_injury"],
    required: true,
  },
  severity_level: {
    type: String,
    enum: ["None", "Mild", "Moderate", "Severe"],
    required: true,
  },
  treatment_advised: {
    type: String,
    enum: ["No Treatment", "Physiotherapy", "Surgery"],
    required: true,
  },

  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("FormData", FormDataSchema);
