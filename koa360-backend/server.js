const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://knee-care-lilac.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
  });

// ================= ROUTES =================

// Import Routes
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


app.use("/api/auth", authRoutes);
app.use("/api/sensor", sensorRoutes);
app.use("/api/form", formRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/predict", predictRoutes);
app.use("/api/vag", vagSeverityRoutes);
app.use("/api/koa", koaSeverityRoutes);
app.use("/api/vag-features", vagSeverityFromFeaturesRoutes);
app.use("/api/monthly", monthlySeverityRoutes);
app.use("/api/vag-latest", vagSeverityLatest);
app.use("/api/xray", xrayPredictRoutes);
app.use("/api/fusion", fusionPredictRoutes);
app.use("/api/mri", mriRoutes);

// Hugging Face ML API routes
const upload = multer({ storage: multer.memoryStorage() });
app.use(upload.single("image"));
app.use("/api/ml", mlApiRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Knee Monitor API is running");
});

// Server start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});