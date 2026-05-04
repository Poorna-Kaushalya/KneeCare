const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

/* ========================
   MIDDLEWARE
======================== */

app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

/* ========================
   MONGO DB CONNECTION
======================== */

const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err.message));

/* ========================
   ROUTES IMPORTS
======================== */

const authRoutes = require("./routes/auth");
const sensorRoutes = require("./routes/sensor");
const formRoutes = require("./routes/form");
const patientRoutes = require("./routes/patient");
const predictRoutes = require("./routes/predict");
const vagSeverityRoutes = require("./routes/vagSeverity.routes");
const koaSeverityRoutes = require("./routes/koaSeverity");
const vagSeverityFromFeaturesRoutes = require("./routes/vagSeverity.fromFeatures.routes");
const xrayPredictRoutes = require("./routes/xrayPredict");
const fusionPredictRoutes = require("./routes/fusionPredict");
const monthlySeverityRoutes = require("./routes/monthlySeverityRoutes");
const vagSeverityLatest = require("./routes/vagSeverityLatest");
const mriRoutes = require("./routes/mriRoutes");
const mlApiRoutes = require("./routes/mlApiRoutes");

/* ========================
   ROUTES USAGE
======================== */

// Auth & Core
app.use("/", authRoutes);
app.use("/", sensorRoutes);
app.use("/", formRoutes);
app.use("/", patientRoutes);
app.use("/", predictRoutes);

// ML / Medical
app.use("/", vagSeverityRoutes);
app.use("/", koaSeverityRoutes);
app.use("/", vagSeverityFromFeaturesRoutes);
app.use("/", monthlySeverityRoutes);
app.use("/", vagSeverityLatest);

// Imaging
app.use("/", xrayPredictRoutes);
app.use("/api/fusion", fusionPredictRoutes);   
app.use("/", mriRoutes);

// External ML API routes
app.use("/", mlApiRoutes);

/* ========================
   HEALTH CHECK
======================== */

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "API is running" });
});

/* ========================
   SERVER START
======================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});