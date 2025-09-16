const appModel = require("../models/appointment.model");
const nodemailer = require("nodemailer");
const userModel = require("../models/user.model");

//Book
const bookAppointment = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user.id)
      .select("firstname lastname email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const {
      matric,
      department,
      level,
      gender,
      phonenumber,
      date,
      time,
      reasontype,
      reasondetails,
    } = req.body;

    //create appointment
    const appointment = await appModel.create({
      patientId: req.user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      matric,
      department,
      level,
      gender,
      phonenumber,
      date: new Date(req.body.date),
      time,
      reasontype,
      reasondetails,
    });

    // Send email confirmation using nodemailer
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"MAPOLY SmartClinic Assistant" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: "Appointment Confirmation",
      text: `Dear ${user.firstname || ""} ${
        user.lastname || ""
      }, your appointment has been booked for ${date} at ${time}.`,
    });

    return res.status(201).json({
      status: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};
module.exports = {
  bookAppointment,
};
