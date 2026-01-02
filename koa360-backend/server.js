const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv"); 
dotenv.config();

const app = express();

// --- Middleware ---
app.use(express.json()); 
app.use(cors());

// --- MongoDB connection ---
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://admin:admin123@cluster0.9wqyyos.mongodb.net/koa360";

mongoose.connect(MONGO_URI)
  .then(() => console.log(" MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
  });

// --- Import Routes ---
const authRoutes = require("./routes/auth");
const sensorRoutes = require("./routes/sensor");
const formRoutes = require("./routes/form");
const patientRoutes = require("./routes/patient"); 
const predictRoutes = require("./routes/predict");
const vagSeverityRoutes = require("./routes/vagSeverity.routes");
const koaSeverityRoutes = require("./routes/koaSeverity");

// --- Use Routes ---
app.use("/", authRoutes);
app.use("/", sensorRoutes);
app.use("/", formRoutes);
app.use("/", patientRoutes); 
app.use("/", predictRoutes);
app.use("/", vagSeverityRoutes);
app.use("/", koaSeverityRoutes);

// --- Basic Route 
app.get("/", (req, res) => {
  res.send("Knee Monitor API is running");
});

// --- Start server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`)); 