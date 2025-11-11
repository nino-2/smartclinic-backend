const appModel = require("../models/appointment.model");
const userModel = require("../models/user.model");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.MAPOLY_SENDGRID_KEY);

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
    // const transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.GMAIL_USER,
    //     pass: process.env.GMAIL_PASS,
    //   },
    // });

    // Send Email Confirmation via SendGrid
    const msg = {
      to: user.email,
      from: {
        name: "MAPOLY SmartClinic Assistant",
        email: process.env.GMAIL_USER,
      },
      subject: "Appointment Confirmation",
      text: `Dear ${user.firstname || ""} ${
        user.lastname || ""
      }, your appointment has been booked for ${date} at ${time}.`,
    };

    await sgMail.send(msg);

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
