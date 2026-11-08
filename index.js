
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;

const dbConnect = require("./config/dbConnect");
const dotenv = require("dotenv").config({ quiet: true });
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const morgan = require("morgan");

dbConnect();

app.use(morgan("dev"));

const allowedOrigins = [
  "http://localhost:5173",
  "https://hotel-management-khaki-three.vercel.app",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Cache-Control"
  );

  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Room management routes
app.use("/api/rooms-management", require("./routes"));


app.listen(PORT, () => {
  console.log(`ASH PMS server running at http://localhost:${PORT}`);
});
