const express = require("express");
const axios = require("axios");
const FormData = require("form-data");

const router = express.Router();

const ML_API_URL = process.env.ML_API_URL;

// General tabular model
router.post("/api/ml/general", async (req, res) => {
  try {
    const response = await axios.post(`${ML_API_URL}/predict/general`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "General ML API failed",
      details: error.response?.data || error.message,
    });
  }
});

// VAG features model
router.post("/api/ml/vag-features", async (req, res) => {
  try {
    const response = await axios.post(`${ML_API_URL}/predict/vag-features`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "VAG features ML API failed",
      details: error.response?.data || error.message,
    });
  }
});

// VAG severity model
router.post("/api/ml/vag-severity", async (req, res) => {
  try {
    const response = await axios.post(`${ML_API_URL}/predict/vag-severity`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "VAG severity ML API failed",
      details: error.response?.data || error.message,
    });
  }
});

// X-ray image model
router.post("/api/ml/xray", async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded. Use key: image" });
    }

    const form = new FormData();
    form.append("image", req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const response = await axios.post(`${ML_API_URL}/predict/xray`, form, {
      headers: form.getHeaders(),
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "X-ray ML API failed",
      details: error.response?.data || error.message,
    });
  }
});



module.exports = router;