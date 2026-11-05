const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
const dbConnect = require("./config/dbConnect");
const dotenv = require("dotenv").config({ quiet: true });
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");

dbConnect(); // Connect to MongoDB
app.use(morgan("dev")); // Logging middleware

const allowedOrigins = [
  "http://localhost:5173",
  "https://hotel-management-khaki-three.vercel.app/",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Cache-Control",
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(cookieParser()); // Middleware to parse cookies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded request bodies

app.use("/api/test", require("./routes/testRoute")); // Test API routes
// Test API
app.get("/api/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "StayFlow API is working!",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`ASH PMS server running at http://localhost:${PORT}`);
});
