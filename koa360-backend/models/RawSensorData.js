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

const RawSensorSchema = new mongoose.Schema(
  {
    device_id: { type: String, required: true },

    upper: {
      ax: Number, ay: Number, az: Number,
      gx: Number, gy: Number, gz: Number, temp: Number,
    },

    lower: {
      ax: Number, ay: Number, az: Number,
      gx: Number, gy: Number, gz: Number, temp: Number,
    },

    knee_angle: Number,

    temperature: {
      ambient: Number,
      object: Number,
    },

    // keep legacy mic
    microphone: {
      rms: Number,
      peak: Number,
      energy: Number,
    },

    microphone_features: { type: MicFeatureSchema, required: false },
    microphone_features_aligned: { type: MicFeatureSchema, required: false },
    knee_tempurarture: { type: Number, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RawSensorData", RawSensorSchema);
