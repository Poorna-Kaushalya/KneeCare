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
      return cb(new Error("Invalid image type. Only JPG, PNG, and WEBP are allowed."), false);
    }
    cb(null, true);
  },
});

// Always use python from venv
const PYTHON_EXE =
  process.platform === "win32"
    ? path.join(__dirname, "..", "pyenv", "Scripts", "python.exe")
    : "python3";

// Gate model path
const GATE_MODEL_PATH = path.join(__dirname, "..", "models", "gate.pt");

// Prediction model path (Normal / Osteoarthritis)
const PRED_MODEL_PATH = path.join(__dirname, "..", "models", "best.pt");

// Python script path
const PY_SCRIPT = path.join(__dirname, "..", "python", "predict_xray.py");

router.post("/api/predict/xray", upload.single("image"), (req, res) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({
        ok: false,
        error: "Image file is required. Use form-data field name: image",
      });
    }

    if (!fs.existsSync(GATE_MODEL_PATH)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(500).json({
        ok: false,
        error: "Gate model file not found",
        gateModelPath: GATE_MODEL_PATH,
      });
    }

    if (!fs.existsSync(PRED_MODEL_PATH)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(500).json({
        ok: false,
        error: "Prediction model file not found",
        predictionModelPath: PRED_MODEL_PATH,
      });
    }

    if (!fs.existsSync(PY_SCRIPT)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(500).json({
        ok: false,
        error: "Python script not found",
        scriptPath: PY_SCRIPT,
      });
    }

    const imgPath = path.resolve(req.file.path);
    const gateModelAbs = path.resolve(GATE_MODEL_PATH);
    const predModelAbs = path.resolve(PRED_MODEL_PATH);
    const scriptAbs = path.resolve(PY_SCRIPT);

    const cwd = path.join(__dirname, "..");

    const py = spawn(PYTHON_EXE, [scriptAbs, gateModelAbs, predModelAbs, imgPath], {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (d) => {
      stdout += d.toString();
    });

    py.stderr.on("data", (d) => {
      stderr += d.toString();
    });

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
          gateModelPath: gateModelAbs,
          predictionModelPath: predModelAbs,
        });
      }

      try {
        const raw = (stdout || "").trim();
        const data = JSON.parse(raw);

        // Wrong image inserted
        if (data.validImage === false) {
          return res.status(400).json({
            ok: false,
            validImage: false,
            error: data.error || "Wrong image inserted. Please upload a correct knee X-ray image.",
            gate: data.gate || null,
          });
        }

        // Any python-side error
        if (data.ok === false) {
          return res.status(500).json(data);
        }

        // Success
        return res.status(200).json({
          ok: true,
          validImage: true,
          message: data.message || "Prediction successful",
          type: data.type,
          label: data.label,
          confidence: data.confidence,
          classId: data.classId ?? null,
        });
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
    return res.status(500).json({
      ok: false,
      error: e.message,
    });
  }
});

module.exports = router;