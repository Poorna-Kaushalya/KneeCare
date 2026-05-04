const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { spawn } = require("child_process");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "fusion");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || ".jpg");
    const name = `fusion_${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const PYTHON_EXE =
  process.platform === "win32"
    ? path.join(__dirname, "..", "pyenv", "Scripts", "python.exe")
    : "python3";

const SCRIPT_PATH = path.join(__dirname, "..", "python", "predict_fusion.py");


router.post("/ml/fusion", upload.single("xray"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        ok: false,
        error: "X-ray image is required (field name: xray)",
      });
    }

    let tabular = {};
    try {
      tabular = req.body.tabular ? JSON.parse(req.body.tabular) : req.body;
    } catch {
      return res.status(400).json({
        ok: false,
        error: "Invalid tabular JSON",
      });
    }

    const payload = {
      image_path: path.resolve(file.path),
      tabular,
    };

    const py = spawn(PYTHON_EXE, [SCRIPT_PATH], {
      cwd: path.join(__dirname, ".."),
      stdio: ["pipe", "pipe", "pipe"],
    });

    let out = "";
    let err = "";

    py.stdout.on("data", (d) => (out += d.toString()));
    py.stderr.on("data", (d) => (err += d.toString()));

    py.on("close", (code) => {
      fs.unlinkSync(file.path);

      if (code !== 0) {
        return res.status(500).json({
          ok: false,
          error: "Fusion prediction failed",
          stderr: err,
          stdout: out,
        });
      }

      try {
        const result = JSON.parse(out);
        return res.json(result);
      } catch {
        return res.status(500).json({
          ok: false,
          error: "Invalid JSON from Python",
          raw: out,
        });
      }
    });

    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: "Server error",
      details: e.message,
    });
  }
});

module.exports = router;