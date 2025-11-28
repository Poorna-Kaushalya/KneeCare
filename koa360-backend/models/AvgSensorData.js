// backend/models/AvgSensorData.js

const mongoose = require("mongoose");

const AvgSensorDataSchema = new mongoose.Schema(
  {
    device_id: { type: String, required: true, index: true }, // Crucial for linking
    avg_upper: {
      ax: Number, ay: Number, az: Number,
      gx: Number, gy: Number, gz: Number,
      temp: Number, // Sum/count of raw upper.temp
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
    avg_piezo: {
      raw: Number,
      voltage: Number,
      trigger_rate: Number, 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AvgSensorData", AvgSensorDataSchema);