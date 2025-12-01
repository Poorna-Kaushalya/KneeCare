const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

const router = express.Router();
const JWT_SECRET = "your_secret_key";

// Doctor Registration
router.post("/register/doctor", async (req, res) => {
  const {fullName,phone,specialization, username, password, regNo  } = req.body;
  try {
    const doctor = new Doctor({ fullName,phone,specialization, username, password, regNo });
    await doctor.save();
    res.json({ success: true, message: "Doctor registered successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Doctor login
router.post("/login/doctor", async (req, res) => {
  const { username, password } = req.body;
  const user = await Doctor.findOne({ username });
  if (!user) return res.status(400).json({ error: "Doctor not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid password" });

  const token = jwt.sign({ id: user._id, username: user.username, role: "doctor" }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

// Patient login
router.post("/login/patient", async (req, res) => {
  const { username, password } = req.body;
  const user = await Patient.findOne({ username });
  if (!user) return res.status(400).json({ error: "Patient not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: "Invalid password" });

  const token = jwt.sign({ id: user._id, username: user.username, role: "patient" }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

module.exports = router;