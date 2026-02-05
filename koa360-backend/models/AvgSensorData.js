const mongoose = require("mongoose");

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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AvgSensorData", AvgSensorDataSchema);
