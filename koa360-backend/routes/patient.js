// routes/patients.routes.js

const express = require("express");
const Patient = require("../models/Patient");
const router = express.Router();

// Helper: remove password before sending
const stripPassword = (p) => {
  const obj = p.toObject ? p.toObject() : { ...p };
  delete obj.password;
  return obj;
};

// ✅ Utility: allow only specific keys in update
const pick = (obj, keys) => {
  const out = {};
  keys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  });
  return out;
};

// ======================= GET ALL PATIENTS =======================
router.get("/api/patients", async (req, res) => {
  try {
    const patients = await Patient.find({});
    res.status(200).json(patients.map(stripPassword));
  } catch (err) {
    console.error("Error fetching all patients:", err.message);
    res.status(500).json({ error: "Failed to fetch patients", details: err.message });
  }
});

// ======================= GET ONE PATIENT =======================
router.get("/api/patients/:id", async (req, res) => {
  try {
    const patient = await Patient.findOne({ id: req.params.id });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.status(200).json(stripPassword(patient));
  } catch (err) {
    console.error("Error fetching patient by ID:", err.message);
    res.status(500).json({ error: "Failed to fetch patient details", details: err.message });
  }
});

// ======================= CREATE PATIENT (NO MEDICAL DATA) =======================
router.post("/api/patients", async (req, res) => {
  try {
    const {
      id,
      name,
      age,
      gender,
      severityLevel,
      lastClinicDate,
      nextClinicDate,
      username,
      password,
      doctorRegNo,
      device_id,
      assignedDoctorName,
      contact,
      medicationList,
    } = req.body;

    // Basic validation
    if (!id || !name || !username || !password) {
      return res.status(400).json({
        error: "Patient ID, Name, Username, and Password are required.",
      });
    }

    // Uniqueness checks
    const existingPatientId = await Patient.findOne({ id });
    if (existingPatientId) {
      return res.status(400).json({
        error: `Patient with ID '${id}' already exists.`,
      });
    }

    const existingUsername = await Patient.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        error: `Username '${username}' is already taken.`,
      });
    }

    if (device_id) {
      const existingDevice = await Patient.findOne({ device_id });
      if (existingDevice) {
        return res.status(400).json({
          error: `Device ID '${device_id}' is already assigned to another patient.`,
        });
      }
    }

    // ✅ IMPORTANT: we do NOT set medical fields here
    const newPatient = new Patient({
      id,
      name,
      age: age !== undefined && age !== "" ? parseInt(age, 10) : undefined,
      gender,
      severityLevel,
      lastClinicDate,
      nextClinicDate,
      username,
      password,
      doctorRegNo,
      device_id,
      assignedDoctorName,
      contact,
      medicationList,
    });

    await newPatient.save();
    res.status(201).json(stripPassword(newPatient));
  } catch (err) {
    console.error("Error adding new patient:", err.message);
    if (err.name === "ValidationError") {
      const errors = {};
      Object.keys(err.errors).forEach((key) => (errors[key] = err.errors[key].message));
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    res.status(500).json({ error: "Failed to add patient", details: err.message });
  }
});

// ======================= UPDATE PATIENT (MEDICAL DATA + OTHER SAFE FIELDS) =======================
router.put("/api/patients/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Allowed update fields
    const allowed = [
      // basic profile
      "name",
      "age",
      "gender",
      "severityLevel",
      "lastClinicDate",
      "nextClinicDate",
      "doctorRegNo",
      "device_id",
      "assignedDoctorName",
      "contact",
      "medicationList",

      // ✅ medical fields (from your MedicalDataUpdateModal)
      "heightCm",
      "weightKg",
      "previousKneeInjury",
      "crp",
      "esr",
      "rf",
      "cholesterol",
      "wbc",
      "platelets",
      "fbs",
      "sugar",
      "fbcValue",

      // optional
      "username",
      "password",
    ];

    const updateData = pick(req.body || {}, allowed);

    // ❌ prevent id changes
    if (req.body?.id && req.body.id !== id) {
      return res.status(400).json({
        error: "Cannot change patient ID via update.",
      });
    }

    // ✅ Convert null -> undefined (so mongoose stores empty correctly)
    Object.keys(updateData).forEach((k) => {
      if (updateData[k] === null) updateData[k] = undefined;
      if (updateData[k] === "") updateData[k] = undefined;
    });

    // ✅ password must be hashed via .save()
    if (updateData.password) {
      const patientToUpdate = await Patient.findOne({ id });
      if (!patientToUpdate) return res.status(404).json({ error: "Patient not found" });

      patientToUpdate.password = updateData.password;
      await patientToUpdate.save();
      delete updateData.password;
    }

    // duplicate username check
    if (updateData.username) {
      const existingPatientWithUsername = await Patient.findOne({
        username: updateData.username,
      });
      if (existingPatientWithUsername && existingPatientWithUsername.id !== id) {
        return res.status(400).json({
          error: `Username '${updateData.username}' is already taken by another patient.`,
        });
      }
    }

    // duplicate device check
    if (updateData.device_id) {
      const existingPatientWithDevice = await Patient.findOne({
        device_id: updateData.device_id,
      });
      if (existingPatientWithDevice && existingPatientWithDevice.id !== id) {
        return res.status(400).json({
          error: `Device ID '${updateData.device_id}' is already assigned to another patient.`,
        });
      }
    }

    const updated = await Patient.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Patient not found" });

    res.status(200).json(stripPassword(updated));
  } catch (err) {
    console.error("Error updating patient:", err.message);
    if (err.name === "ValidationError") {
      const errors = {};
      Object.keys(err.errors).forEach((key) => (errors[key] = err.errors[key].message));
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    res.status(500).json({ error: "Failed to update patient", details: err.message });
  }
});

// ======================= DELETE PATIENT =======================
router.delete("/api/patients/:id", async (req, res) => {
  try {
    const patient = await Patient.findOneAndDelete({ id: req.params.id });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.status(200).json({ message: `Patient with ID '${req.params.id}' deleted successfully.` });
  } catch (err) {
    console.error("Error deleting patient:", err.message);
    res.status(500).json({ error: "Failed to delete patient", details: err.message });
  }
});

module.exports = router;