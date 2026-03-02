const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const router = express.Router();

router.post("/api/predict", (req, res) => {
  const pythonExe =
    process.platform === "win32"
      ? path.join(__dirname, "..", "pyenv", "Scripts", "python.exe")
      : "python3";

  const scriptPath = path.join(__dirname, "..", "predict.py");
  const cwd = path.join(__dirname, "..");

  const py = spawn(pythonExe, [scriptPath], { cwd });

  py.stdin.write(JSON.stringify({ features: req.body.features }));
  py.stdin.end();

  let out = "";
  let err = "";

  py.stdout.on("data", (d) => (out += d.toString()));
  py.stderr.on("data", (d) => (err += d.toString()));

  py.on("error", (spawnErr) => {
    return res.status(500).json({
      error: "Failed to start Python process",
      details: spawnErr.message,
      pythonExe,
      scriptPath,
    });
  });

  py.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({
        error: "Python process failed",
        exitCode: code,
        stderr: err || null,
        stdout: out || null,
        pythonExe,
        scriptPath,
      });
    }

    try {
      const data = JSON.parse((out || "").trim());
      return res.json(data);
    } catch (e) {
      return res.status(500).json({
        error: "Invalid JSON from Python",
        raw: out,
        stderr: err || null,
      });
    }
  });
});

module.exports = router;