const express = require("express");
const axios = require("axios");
const FormData = require("form-data");

const router = express.Router();

router.post("/api/ml/general", async (req, res) => {
  try {
    const response = await axios.post(
      `${process.env.ML_API_URL}/predict/general`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "General ML API failed",
      details: error.response?.data || error.message,
    });
  }
});

router.post("/api/ml/vag-features", async (req, res) => {
  try {
    const response = await axios.post(
      `${process.env.ML_API_URL}/predict/vag-features`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "VAG features API failed",
      details: error.response?.data || error.message,
    });
  }
});

router.post("/api/ml/fusion", async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const form = new FormData();
    form.append("image", req.file.buffer, req.file.originalname);
    form.append("tabular", JSON.stringify(req.body));

    const response = await axios.post(
      `${process.env.ML_API_URL}/predict/fusion-upload`,
      form,
      { headers: form.getHeaders() }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Fusion ML API failed",
      details: error.response?.data || error.message,
    });
  }
});

module.exports = router;