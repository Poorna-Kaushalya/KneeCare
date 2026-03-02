const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "xrays");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `xray_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Invalid image type (Only JPG/PNG/WEBP allowed)"), false);
    }
    cb(null, true);
  },
});

// ✅ Always use python from venv
const PYTHON_EXE =
  process.platform === "win32"
    ? path.join(__dirname, "..", "pyenv", "Scripts", "python.exe")
    : "python3";

// ✅ Make model path portable (put model in koa360-backend/models/)
const MODEL_PATH = path.join(__dirname, "..", "models", "best.pt");

// Python script
const PY_SCRIPT = path.join(__dirname, "..", "python", "predict_xray.py");

router.post("/api/predict/xray", upload.single("image"), (req, res) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({
        ok: false,
        error: "Image file is required. Use form-data field name: image",
      });
    }

    // Ensure model exists
    if (!fs.existsSync(MODEL_PATH)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(500).json({
        ok: false,
        error: "Model file not found",
        modelPath: MODEL_PATH,
      });
    }

    const imgPath = path.resolve(req.file.path);
    const modelPathAbs = path.resolve(MODEL_PATH);
    const scriptAbs = path.resolve(PY_SCRIPT);

    const cwd = path.join(__dirname, "..");

    const py = spawn(PYTHON_EXE, [scriptAbs, modelPathAbs, imgPath], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (d) => (stdout += d.toString()));
    py.stderr.on("data", (d) => (stderr += d.toString()));

    py.on("error", (spawnErr) => {
      try { fs.unlinkSync(imgPath); } catch (_) {}
      return res.status(500).json({
        ok: false,
        error: "Failed to start Python process",
        details: spawnErr.message,
        pythonExe: PYTHON_EXE,
        scriptPath: scriptAbs,
      });
    });

    py.on("close", (code) => {
      // cleanup uploaded file
      try { fs.unlinkSync(imgPath); } catch (_) {}

      if (code !== 0) {
        return res.status(500).json({
          ok: false,
          error: "Python process failed",
          exitCode: code,
          stderr: stderr || null,
          stdout: stdout || null,
          pythonExe: PYTHON_EXE,
          scriptPath: scriptAbs,
          modelPath: modelPathAbs,
        });
      }

      // parse JSON safely
      try {
        const data = JSON.parse((stdout || "").trim());
        return res.status(data.ok === false ? 500 : 200).json(data);
      } catch (e) {
        return res.status(500).json({
          ok: false,
          error: "Non-JSON output from python script",
          raw: stdout,
          stderr,
        });
      }
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;