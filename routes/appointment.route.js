const express = require("express");
const appointmentRouter = express.Router();
const { bookAppointment } = require("../controllers/appointment.controller");
const auth = require("../middleware/auth");

appointmentRouter.post("/book", auth, bookAppointment);
// appointmentRouter.get("/myappointment", auth, myAppointment);

module.exports = appointmentRouter;
