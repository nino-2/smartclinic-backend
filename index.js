const express = require("express");
const app = express();
const port = process.env.PORT || 5001;
const mongoose = require("mongoose");
const axios = require("axios");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const userRouter = require("./routes/auth.route");
const appointmentRouter = require("./routes/appointment.route");
const chatRouter = require("./routes/chat.route");
const adminRouter = require("./routes/admin.route");
const allowedOrigins = [
  "http://localhost:5173",
  "https://smartclinic-react-hu19.vercel.app",
];

require("dotenv").config();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"), false);
      }
    },
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", userRouter);
app.use("/appointment", appointmentRouter);
app.use("/chat", chatRouter);
app.use("/admin", adminRouter);

let URI = process.env.MONGODB_URI;
mongoose
  .connect(URI)
  .then(() => {
    console.log("mongodb connected successfully");
  })
  .catch((err) => {
    console.log("mongodb didnt connect", err);
  });

app.listen(port, (err) => {
  if (err) {
    console.log("server didnt start");
  } else {
    console.log("server has started");
  }
});

app.get("/env-check", (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    isProd: process.env.NODE_ENV === "production",
  });
});
