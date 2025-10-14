// models/AvgSensorData.js
const mongoose = require("mongoose");

const AvgSensorSchema = new mongoose.Schema(
  {
    device_id: { type: String, required: true },

    avg_upper: {
      ax: { type: Number, required: true },
      ay: { type: Number, required: true },
      az: { type: Number, required: true },
      gx: { type: Number },
      gy: { type: Number },
      gz: { type: Number },
      temp: { type: Number },
    },

    avg_lower: {
      ax: { type: Number, required: true },
      ay: { type: Number, required: true },
      az: { type: Number, required: true },
      gx: { type: Number },
      gy: { type: Number },
      gz: { type: Number },
      temp: { type: Number },
    },

    avg_knee_angle: { type: Number, required: true },

    avg_temperature: {
      ambient: { type: Number }, 
      object: { type: Number },  
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AvgSensorData", AvgSensorSchema);
