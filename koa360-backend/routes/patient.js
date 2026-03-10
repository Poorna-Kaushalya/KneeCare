const express = require("express");
const Patient = require("../models/Patient");
const router = express.Router();

const stripPassword = (p) => {
  const obj = p.toObject ? p.toObject() : { ...p };
  delete obj.password;
  return obj;
};

const pick = (obj, keys) => {
  const out = {};
  keys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(obj, k)) out[k] = obj[k];
  });
  return out;
};

router.get("/api/patients", async (req, res) => {
  try {
    const patients = await Patient.find({});
    res.status(200).json(patients.map(stripPassword));
  } catch (err) {
    console.error("Error fetching all patients:", err.message);
    res.status(500).json({ error: "Failed to fetch patients", details: err.message });
  }
});

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

    if (!id || !name || !username || !password) {
      return res.status(400).json({
        error: "Patient ID, Name, Username, and Password are required.",
      });
    }

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

router.put("/api/patients/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const allowed = [
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
      "cs",

      "occupation",
      "physical_activity_level",
      "pain_score",
      "stiffness",
      "do_you_currently_experience_knee_pain",
      "do_you_experience_swelling_in_your_knees",
      "do_you_find_difficulty_in_performing_these_activities_(check_all_that_apply)",
      "does_the_patient_has_obesity",
      "does_the_patient_has_diabetes",
      "does_the_patient_has_hypertension",
      "does_the_patient_have_any_other_health_conditions_or_risk_factors_that_may_contribute_to_knee_osteoarthritis",
      "what_are_the_suggested_or_ongoing_treatments_for_the_patients_current_condition",

      "username",
      "password",
    ];

    const updateData = pick(req.body || {}, allowed);

    if (req.body?.id && req.body.id !== id) {
      return res.status(400).json({
        error: "Cannot change patient ID via update.",
      });
    }

    Object.keys(updateData).forEach((k) => {
      if (updateData[k] === null) updateData[k] = undefined;
      if (updateData[k] === "") updateData[k] = undefined;
    });

    if (updateData.password) {
      const patientToUpdate = await Patient.findOne({ id });
      if (!patientToUpdate) return res.status(404).json({ error: "Patient not found" });

      patientToUpdate.password = updateData.password;
      await patientToUpdate.save();
      delete updateData.password;
    }

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