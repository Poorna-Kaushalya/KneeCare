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
    doctorRegNo: { type: String, required: true },
    device_id: {
      type: String,
      unique: true,
      sparse: true,
    },
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