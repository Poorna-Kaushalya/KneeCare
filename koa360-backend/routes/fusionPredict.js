const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { spawn } = require("child_process");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "fusion");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Save uploaded image to disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || ".jpg");
    const name = `fusion_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
});

// POST /api/fusion/predict
router.post("/predict", upload.single("xray"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "X-ray image is required (field name: xray)" });
    }

    const imagePath = req.file.path;

    const tabular = { ...req.body };

    // Python script path
    const scriptPath = path.join(__dirname, "..", "python", "predict_fusion.py");

    const pyExe = "python";

    const payload = {
      image_path: imagePath,
      tabular: tabular,
    };

    const py = spawn(pyExe, [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });

    let out = "";
    let err = "";

    py.stdout.on("data", (d) => (out += d.toString()));
    py.stderr.on("data", (d) => (err += d.toString()));

    py.on("close", (code) => {
      // optional: delete uploaded file after prediction
      try { fs.unlinkSync(imagePath); } catch (_) {}

      if (code !== 0) {
        console.error("Python error:", err);
        return res.status(500).json({ error: "Fusion prediction failed", details: err });
      }

      try {
        const result = JSON.parse(out);
        return res.json(result);
      } catch (e) {
        console.error("Bad python JSON:", out);
        return res.status(500).json({ error: "Bad response from model", raw: out });
      }
    });

    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error", details: String(e) });
  }
});

module.exports = router;
