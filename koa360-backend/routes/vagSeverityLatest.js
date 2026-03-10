const express = require("express");
const router = express.Router();

const MonthlySeverityPrediction = require("../models/MonthlySeverityPrediction");

//  GET SAVED MONTHLY SEVERITY  
router.get("/api/vag/severity/monthly/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    const rows = await MonthlySeverityPrediction.find({ device_id: deviceId })
      .sort({ year: 1, month: 1 });

    if (!rows.length) {
      return res.status(404).json({
        error: "No monthly severity predictions found for this device.",
      });
    }

    return res.json({
      device_id: deviceId,
      months_found: rows.length,
      predictions: rows,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;