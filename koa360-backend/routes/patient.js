// backend/routes/patient.js (UPDATED)

const express = require("express");
const Patient = require("../models/Patient"); // Make sure this path is correct
// const authMiddleware = require("../middleware/authMiddleware"); // Uncomment if you have this set up and want to secure patient routes

const router = express.Router();

// --- Middleware for authentication (uncomment and use if you have it set up) ---
// router.use(authMiddleware);

// =======================================================
// ✅ GET all patients
// =======================================================
router.get("/api/patients", async (req, res) => {
  try {
    const patients = await Patient.find({});
    // For security, you might want to strip sensitive fields like 'password'
    // from the response, even though they are hashed.
    const patientsWithoutPasswords = patients.map(patient => {
        const p = patient.toObject();
        delete p.password;
        return p;
    });
    res.status(200).json(patientsWithoutPasswords);
  } catch (err) {
    console.error("Error fetching all patients:", err.message);
    res.status(500).json({ error: "Failed to fetch patients", details: err.message });
  }
});

// =======================================================
// ✅ GET a single patient by ID
// =======================================================
router.get("/api/patients/:id", async (req, res) => {
  try {
    // Find by the custom 'id' field, not the MongoDB default _id
    const patient = await Patient.findOne({ id: req.params.id });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    // Exclude password from the response
    const patientResponse = patient.toObject();
    delete patientResponse.password;
    res.status(200).json(patientResponse);
  } catch (err) {
    console.error("Error fetching patient by ID:", err.message);
    res.status(500).json({ error: "Failed to fetch patient details", details: err.message });
  }
});

// =======================================================
// ✅ POST (Create) a new patient
// =======================================================
router.post("/api/patients", async (req, res) => {
  try {
    const { id, name, age, gender, severityLevel, lastClinicDate, nextClinicDate, username, password, doctorRegNo, device_id } = req.body;

    // --- Basic Validation ---
    if (!id || !name || !username || !password) {
        return res.status(400).json({ error: "Patient ID, Name, Username, and Password are required." });
    }

    // --- Check for Uniqueness ---
    const existingPatientId = await Patient.findOne({ id });
    if (existingPatientId) {
      return res.status(400).json({ error: `Patient with ID '${id}' already exists. Please use a unique ID.` });
    }
    const existingUsername = await Patient.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: `Username '${username}' is already taken. Please choose a different username.` });
    }
    if (device_id) { // device_id is optional but if provided, must be unique
        const existingDevice = await Patient.findOne({ device_id });
        if (existingDevice) {
            return res.status(400).json({ error: `Device ID '${device_id}' is already assigned to another patient. Please use a unique device ID.` });
        }
    }

    // Create new patient instance
    const newPatient = new Patient({
      id,
      name,
      age: age ? parseInt(age) : undefined, // Ensure age is stored as a number
      gender,
      severityLevel,
      lastClinicDate,
      nextClinicDate,
      username,
      password, // Mongoose pre-save hook in Patient model will hash this
      doctorRegNo,
      device_id,
    });

    await newPatient.save();

    // Exclude password from the response for security
    const patientResponse = newPatient.toObject();
    delete patientResponse.password;
    res.status(201).json(patientResponse); // 201 Created status
  } catch (err) {
    console.error("Error adding new patient:", err.message);
    // Mongoose validation errors
    if (err.name === 'ValidationError') {
        let errors = {};
        Object.keys(err.errors).forEach((key) => {
            errors[key] = err.errors[key].message;
        });
        return res.status(400).json({ error: "Validation failed", details: errors });
    }
    res.status(500).json({ error: "Failed to add patient", details: err.message });
  }
});

// =======================================================
// ✅ PUT (Update) a patient by ID
// =======================================================
router.put("/api/patients/:id", async (req, res) => {
  try {
    const { id } = req.params; // The patient 'id' from the URL parameter
    const updateData = req.body;

    // Prevent changing the unique patient ID from the body to avoid conflicts
    // The 'id' in the URL is the one being updated.
    if (updateData.id && updateData.id !== id) {
        return res.status(400).json({ error: "Cannot change patient ID via update. The ID in the URL is the target for update." });
    }

    // If password is being updated, handle it via save() to trigger pre-save hashing hook
    if (updateData.password) {
        const patientToUpdate = await Patient.findOne({ id });
        if (patientToUpdate) {
            patientToUpdate.password = updateData.password; // Mongoose pre-save hook will hash it
            await patientToUpdate.save(); // Save to trigger hashing
            delete updateData.password; // Remove from general update to avoid double processing or error
        } else {
            return res.status(404).json({ error: "Patient not found for password update." });
        }
    }

    // Check for duplicate username if it's being updated
    if (updateData.username) {
        const existingPatientWithUsername = await Patient.findOne({ username: updateData.username });
        if (existingPatientWithUsername && existingPatientWithUsername.id !== id) {
            return res.status(400).json({ error: `Username '${updateData.username}' is already taken by another patient.` });
        }
    }

    // Check for duplicate device_id if it's being updated
    if (updateData.device_id) {
        const existingPatientWithDevice = await Patient.findOne({ device_id: updateData.device_id });
        if (existingPatientWithDevice && existingPatientWithDevice.id !== id) {
            return res.status(400).json({ error: `Device ID '${updateData.device_id}' is already assigned to another patient.` });
        }
    }

    // Find the patient by the custom 'id' field and update
    const patient = await Patient.findOneAndUpdate(
      { id: id },
      { $set: updateData }, // $set ensures only provided fields are updated
      { new: true, runValidators: true } // Return the updated document; run schema validators on update
    );

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Exclude password from the response
    const patientResponse = patient.toObject();
    delete patientResponse.password;
    res.status(200).json(patientResponse);
  } catch (err) {
    console.error("Error updating patient:", err.message);
    if (err.name === 'ValidationError') {
        let errors = {};
        Object.keys(err.errors).forEach((key) => {
            errors[key] = err.errors[key].message;
        });
        return res.status(400).json({ error: "Validation failed", details: errors });
    }
    res.status(500).json({ error: "Failed to update patient", details: err.message });
  }
});

// =======================================================
// ✅ DELETE a patient by ID
// =======================================================
router.delete("/api/patients/:id", async (req, res) => {
  try {
    // Find and delete by the custom 'id' field
    const patient = await Patient.findOneAndDelete({ id: req.params.id });
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.status(200).json({ message: `Patient with ID '${req.params.id}' deleted successfully.` });
  } catch (err) {
    console.error("Error deleting patient:", err.message);
    res.status(500).json({ error: "Failed to delete patient", details: err.message });
  }
});

module.exports = router;