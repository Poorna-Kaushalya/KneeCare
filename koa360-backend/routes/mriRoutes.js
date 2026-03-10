const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "mri");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `mri_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Invalid image type. Only JPG, PNG, and WEBP are allowed."), false);
    }
    cb(null, true);
  },
});

const PYTHON_EXE =
  process.platform === "win32"
    ? path.join(__dirname, "..", "pyenv", "Scripts", "python.exe")
    : "python3";

const MRI_MODEL_PATH = path.join(__dirname, "..", "models", "koa_mri_resnet50_final.keras");
const PY_SCRIPT = path.join(__dirname, "..", "python", "predict_mri.py");

router.post("/api/predict/mri", upload.single("image"), (req, res) => {
  try {
    if (!req.file?.path) {
      return res.status(400).json({
        ok: false,
        error: "Image file is required. Use form-data field name: image",
      });
    }

    if (!fs.existsSync(MRI_MODEL_PATH)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(500).json({
        ok: false,
        error: "MRI model file not found",
        modelPath: MRI_MODEL_PATH,
      });
    }

    if (!fs.existsSync(PY_SCRIPT)) {
      try { fs.unlinkSync(req.file.path); } catch (_) {}
      return res.status(500).json({
        ok: false,
        error: "MRI python script not found",
        scriptPath: PY_SCRIPT,
      });
    }

    const imgPath = path.resolve(req.file.path);
    const modelAbs = path.resolve(MRI_MODEL_PATH);
    const scriptAbs = path.resolve(PY_SCRIPT);

    const py = spawn(PYTHON_EXE, [scriptAbs, modelAbs, imgPath], {
      cwd: path.join(__dirname, ".."),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (d) => (stdout += d.toString()));
    py.stderr.on("data", (d) => (stderr += d.toString()));

    py.on("error", (err) => {
      try { fs.unlinkSync(imgPath); } catch (_) {}
      return res.status(500).json({
        ok: false,
        error: "Failed to start MRI python process",
        details: err.message,
      });
    });

    py.on("close", () => {
      try { fs.unlinkSync(imgPath); } catch (_) {}

      try {
        const raw = (stdout || "").trim();
        const lines = raw.split("\n").map((x) => x.trim()).filter(Boolean);
        const jsonLine = lines[lines.length - 1];
        const data = JSON.parse(jsonLine);

        if (data.ok === false) {
          return res.status(500).json({
            ok: false,
            error: data.error || "MRI prediction failed",
            details: data.details || null,
          });
        }

        return res.status(200).json(data);
      } catch (e) {
        return res.status(500).json({
          ok: false,
          error: "MRI prediction failed",
          details: stderr || stdout || e.message,
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