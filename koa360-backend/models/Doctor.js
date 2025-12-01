const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const DoctorSchema = new mongoose.Schema({
  fullName: { type: String, required: true, },
  phone: { type: String, required: true },
  specialization: { type: String, required: true },
  username: { type: String, required: true, },
  password: { type: String, required: true },
  regNo: { type: String, required: true, unique: true }
});

// Hash password before saving
DoctorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("Doctor", DoctorSchema);
