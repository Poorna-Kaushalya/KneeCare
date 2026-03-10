const express = require("express");
const router = express.Router();

const MonthlySeverityPrediction = require("../models/MonthlySeverityPrediction");

router.post("/api/monthly-severity", async (req, res) => {
  try {
    const data = req.body;

    const saved = await MonthlySeverityPrediction.create(data);

    res.json({
      success: true,
      message: "Monthly severity inserted",
      data: saved,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;