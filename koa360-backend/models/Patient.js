const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const PatientSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    severityLevel: { type: String, required: true },
    lastClinicDate: { type: Date },
    nextClinicDate: { type: Date },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    doctorRegNo: { type: String },
    device_id: { type: String, unique: true, sparse: true },
    assignedDoctorName: { type: String },
    contact: { type: String },
    medicationList: [{ type: String }],
    heightCm: { type: Number, default: null },
    weightKg: { type: Number, default: null },
    previousKneeInjury: { type: Boolean, default: null },
    crp: { type: Number, default: null },
    esr: { type: Number, default: null },
    rf: { type: Number, default: null },
    cholesterol: { type: Number, default: null },
    wbc: { type: Number, default: null },
    platelets: { type: Number, default: null },
    fbs: { type: Number, default: null },
    sugar: { type: Number, default: null },
    fbcValue: { type: Number, default: null },
  },
  { timestamps: true }
);

PatientSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

PatientSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Patient", PatientSchema);