const express = require("express");
const { spawn } = require("child_process");
const path = require("path");

const router = express.Router();

router.post("/api/predict", (req, res) => {
  const pythonExe = path.join(__dirname, "..", "pyenv", "Scripts", "python.exe");

  const py = spawn(pythonExe, ["predict.py"], {
    cwd: path.join(__dirname, ".."),
  });

  py.stdin.write(JSON.stringify({ features: req.body.features }));
  py.stdin.end();

  let out = "";
  let err = "";

  py.stdout.on("data", (d) => (out += d.toString()));
  py.stderr.on("data", (d) => (err += d.toString()));

  py.on("close", (code) => {
    if (err) {
      console.error("Python stderr:", err);
      return res.status(500).json({ error: err });
    }

    try {
      const data = JSON.parse(out);
      return res.json(data);
    } catch (e) {
      console.error("Invalid JSON from Python:", out);
      return res.status(500).json({ error: "Invalid JSON from Python", raw: out });
    }
  });
});

module.exports = router;
