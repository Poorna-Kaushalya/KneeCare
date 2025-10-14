// models/RawSensorData.js
const mongoose = require("mongoose");

const RawSensorSchema = new mongoose.Schema(
  {
    device_id: { type: String, required: true },

    upper: {
      ax: Number,
      ay: Number,
      az: Number,
      gx: Number,
      gy: Number,
      gz: Number,
      temp: Number,
    },

    lower: {
      ax: Number,
      ay: Number,
      az: Number,
      gx: Number,
      gy: Number,
      gz: Number,
      temp: Number,
    },

    knee_angle: Number,

    temperature: {
      ambient: Number, 
      object: Number,  
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RawSensorData", RawSensorSchema);
