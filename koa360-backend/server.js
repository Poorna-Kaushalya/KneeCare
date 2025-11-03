const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const sensorRoutes = require("./routes/sensor");
const formRoutes = require("./routes/form");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
const MONGO_URI = "mongodb+srv://admin:admin123@cluster0.9wqyyos.mongodb.net/koa360";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
  });

// Routes
app.use("/", authRoutes);
app.use("/", sensorRoutes);
app.use("/", formRoutes); 

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
