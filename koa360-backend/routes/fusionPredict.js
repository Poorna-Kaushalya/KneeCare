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

//  Use python from venv
const PYTHON_EXE =
  process.platform === "win32"
    ? path.join(__dirname, "..", "pyenv", "Scripts", "python.exe")
    : "python3";

// Python script path
const SCRIPT_PATH = path.join(__dirname, "..", "python", "predict_fusion.py");

// POST /api/fusion/predict
router.post("/predict", upload.single("xray"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "X-ray image is required (field name: xray)" });
    }

    const imagePath = req.file.path;

    // keep tabular (multer gives strings)
    const tabular = { ...req.body };

    const payload = {
      image_path: path.resolve(imagePath),
      tabular,
    };

    const cwd = path.join(__dirname, ".."); // backend root

    const py = spawn(PYTHON_EXE, [SCRIPT_PATH], {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let out = "";
    let err = "";

    py.stdout.on("data", (d) => (out += d.toString()));
    py.stderr.on("data", (d) => (err += d.toString()));

    py.on("error", (spawnErr) => {
      try {
        fs.unlinkSync(imagePath);
      } catch (_) {}

      return res.status(500).json({
        error: "Failed to start Python process",
        details: spawnErr.message,
        pythonExe: PYTHON_EXE,
        scriptPath: SCRIPT_PATH,
      });
    });

    py.on("close", (code) => {
      // cleanup uploaded file
      try {
        fs.unlinkSync(imagePath);
      } catch (_) {}

      if (code !== 0) {
        return res.status(500).json({
          error: "Fusion prediction failed",
          exitCode: code,
          stderr: err || null,
          stdout: out || null,
          pythonExe: PYTHON_EXE,
          scriptPath: SCRIPT_PATH,
        });
      }

      try {
        const result = JSON.parse((out || "").trim());
        return res.json(result);
      } catch (e) {
        return res.status(500).json({
          error: "Bad response from model (non-JSON)",
          raw: out,
          stderr: err || null,
        });
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