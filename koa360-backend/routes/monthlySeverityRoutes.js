const express = require("express");
const router = express.Router();
const MonthlySeverityPrediction = require("../models/MonthlySeverityPrediction");

// INSERT monthly severity
router.post("/api/monthly-severity", async (req, res) => {
  try {
    const data = req.body;

    const saved = await MonthlySeverityPrediction.create(data);

    return res.json({
      success: true,
      message: "Monthly severity inserted",
      data: saved,
    });
  } catch (err) {
    console.error("monthly severity insert error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET all monthly severity rows for one device
router.get("/api/monthly-severity/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    const rows = await MonthlySeverityPrediction.find({
      device_id: deviceId,
    }).sort({ year: 1, month: 1 });

    if (!rows.length) {
      return res.status(404).json({
        error: "No monthly severity predictions found for this device.",
      });
    }

    return res.json({
      success: true,
      device_id: deviceId,
      count: rows.length,
      predictions: rows,
    });
  } catch (err) {
    console.error("monthly severity fetch error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;