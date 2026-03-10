const mongoose = require("mongoose");

const MicFeatureSchema = new mongoose.Schema(
  {
    rms_amplitude: Number,
    peak_frequency: Number,
    spectral_entropy: Number,
    zero_crossing_rate: Number,
    mean_frequency: Number,
  },
  { _id: false }
);

const AvgSensorDataSchema = new mongoose.Schema(
  {
    device_id: { type: String, required: true, index: true },

    avg_upper: {
      ax: Number, ay: Number, az: Number,
      gx: Number, gy: Number, gz: Number,
      temp: Number,
    },

    avg_lower: {
      ax: Number, ay: Number, az: Number,
      gx: Number, gy: Number, gz: Number,
      temp: Number,
    },

    avg_knee_angle: Number,

    avg_temperature: {
      ambient: Number,
      object: Number,
    },

    avg_microphone: {
      rms: Number,
      peak: Number,
      energy: Number,
    },

    avg_microphone_features: { type: MicFeatureSchema, required: false },
    avg_microphone_features_aligned: { type: MicFeatureSchema, required: false },
    avg_knee_tempurarture: { type: Number, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AvgSensorData", AvgSensorDataSchema);
