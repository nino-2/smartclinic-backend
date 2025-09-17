const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const chatModel = require("../models/chat.model");
const appModel = require("../models/appointment.model");
const activityModel = require("../models/activity.model");
const { activityLogger } = require("../middleware/activityLogger");
const nodemailer = require("nodemailer");

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

// Utility: Send Email
const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"Clinic Admin" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("Error sending email:", err.message);
  }
};

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Request body:", req.body);

    const admin = await userModel.findOne({ username, role: "admin" });

    if (!admin) {
      return res.status(401).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("Password match result:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Create JWT token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const isProd = process.env.NODE_ENV === "production";
    // ✅ Set cookie
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax", // must be "none" in prod to allow Vercel → Render
      maxAge: 24 * 60 * 60 * 1000,
    });

    // success
    return res.status(200).json({
      status: true,
      message: "Admin login successful",
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin Logout
const adminLogout = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === "production";
    // ✅ Set cookie
    res.cookie("adminToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax", // must be "none" in prod to allow Vercel → Render
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// Admin Dashboard
const adminDashboard = async (req, res) => {
  res.status(200).json({ message: `Welcome Admin: ${req.admin.id}` });
};

// Dashboard Stats
const getAppointmentStats = async (req, res) => {
  try {
    // Today range
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const total = await appModel.countDocuments({
      date: { $gte: start, $lte: end },
    });
    const pending = await appModel.countDocuments({ status: "pending" });
    const urgency = await appModel.countDocuments({ urgent: true });

    // "Active chats" = distinct sessions with a message in the last 1 hour
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const activeAgg = await chatModel.aggregate([
      { $unwind: "$messages" },
      { $match: { "messages.timestamp": { $gte: since } } },
      { $group: { _id: "$sessionId" } },
      { $count: "count" },
    ]);
    const active = activeAgg.length ? activeAgg[0].count : 0;

    res.json({ status: true, data: { total, pending, active, urgency } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Server Error" });
  }
};

// Fetch all appointments
const getAllAppointments = async (req, res) => {
  try {
    const { status, date, search } = req.query;
    const filter = {};

    if (status && status !== "all") filter.status = status;

    if (date) {
      if (date === "today") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        filter.date = { $gte: start, $lte: end }; // ✅ match all appointments today
      } else {
        filter.date = new Date(date);
      }
    }

    if (search) {
      filter.patientName = { $regex: search, $options: "i" };
    }

    const appointments = await appModel
      .find(filter)
      .populate("patientId", "firstname lastname")
      .sort({ date: 1, time: 1 });

    // Include patient full name
    const appointmentsWithName = appointments.map((a) => ({
      ...a._doc,
      patientName: a.patientId
        ? `${a.patientId.firstname} ${a.patientId.lastname}`
        : "unknown",
    }));
    res.json({ status: true, appointments: appointmentsWithName }); // ✅ property matches frontend
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: "Server Error" });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date, time } = req.body;

    // Update appointment
    const appointment = await appModel
      .findById(id)
      .populate("patientId", "firstname lastname email");

    if (!appointment) {
      return res
        .status(404)
        .json({ status: false, message: "Appointment not found" });
    }

    appointment.status = status;
    if (status === "rescheduled" && date && time) {
      appointment.date = new Date(date);

      appointment.time = time;
    }

    await appointment.save();

    // Patient details
    const patient = appointment.patientId;
    // const email = patient?.email || appointment.email;
    const name = patient ? `${patient.firstname}` : "Patient";

    // 📧 Send emails
    if (status === "confirmed") {
      await sendEmail(
        appointment.patientId.email,
        "Appointment Approved",
        `Hello ${name},\n\nYour appointment on ${appointment.date} at ${appointment.time} has been approved.\n\n- Admin`
      );
    } else if (status === "cancelled") {
      await sendEmail(
        appointment.patientId.email,
        "Appointment Cancelled",
        `Hello ${name},\n\nYour appointment on ${appointment.date} at ${appointment.time} has been cancelled.\n\n- Admin`
      );
    } else if (status === "rescheduled") {
      await sendEmail(
        appointment.patientId.email,
        "Appointment Rescheduled",
        `Hello ${name},\n\nYour appointment has been rescheduled to ${appointment.date} at ${appointment.time}.\n\n- Admin`
      );
    }

    // Log activity
    if (req.admin?._id) {
      try {
        await activityModel.create({
          user: req.admin._id,
          description: `Updated appointment ${id} to ${status}`,
        });
      } catch (err) {
        console.error("Activity logging failed:", err);
      }
    }

    res.json({
      status: true,
      data: appointment,
      message: `Appointment ${status}`,
    });
  } catch (error) {
    console.error("Error in updateAppointmentStatus:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const recentActivity = async (req, res) => {
  try {
    const activities = await activityModel
      .find()
      .populate("user", "firstname lastname")
      .sort({ createdAt: -1 })
      .limit(5);

    // Map DB fields -> frontend format
    const activity = activities.map((a) => ({
      _id: a._id,
      icon: a.icon || "Activity",
      user: a.user
        ? { firstname: a.user.firstname, lastname: a.user.lastname }
        : null,
      text: a.description || a.text || "Activity",
      createdAt: a.createdAt,
    }));

    res.json({
      status: true,
      activity,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: false, message: "Server Error" });
  }
};

// All Activity
const getAllActivities = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const total = await activityModel.countDocuments();
    const activities = await activityModel
      .find()
      .populate("user", "firstname lastname")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Map DB fields -> frontend format
    const activity = activities.map((a) => ({
      _id: a._id,
      icon: a.icon || "Activity",
      user: a.user
        ? { firstname: a.user.firstname, lastname: a.user.lastname }
        : null,
      text: a.description || a.text || "Activity",
      createdAt: a.createdAt,
    }));

    res.json({
      status: true,
      activity,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
      },
    });
  } catch (error) {}
};

function calculateAge(dob) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

// Fetch all patients
const getAllPatients = async (req, res) => {
  try {
    // fetch all registered patients
    const users = await userModel
      .find({ role: "patient" })
      .select("firstname lastname email dob bloodgroup gender");

    // map each patient with their latest appointment
    const formatted = await Promise.all(
      users.map(async (user) => {
        const lastAppointment = await appModel
          .findOne({ patientId: user._id })
          .sort({ date: -1, time: -1 })
          .select("matric phonenumber department level date");

        return {
          _id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          gender: user.gender,
          age: calculateAge(user.dob),
          bloodgroup: user.bloodgroup,
          address: user.address,
          matric: lastAppointment?.matric || null,
          phonenumber: lastAppointment?.phonenumber || null,
          department: lastAppointment?.department || null,
          level: lastAppointment?.level || null,
          lastVisit: lastAppointment?.date || null,
        };
      })
    );

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Patient by ID
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    const user = await userModel.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const lastAppointment = await appModel.findOne({ patientId: id }).sort({
      date: -1,
      time: -1,
    });

    res.json({
      ...user._doc,
      age: calculateAge(user.dob),
      matric: lastAppointment?.matric || null,
      gender: lastAppointment?.gender || null,
      phonenumber: lastAppointment?.phonenumber || null,
      department: lastAppointment?.department || null,
      level: lastAppointment?.level || null,
      lastVisit: lastAppointment?.date || null,
    });
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//Update Patient
const updatePatient = async (req, res) => {
  try {
    const updatedUser = await userModel
      .findByIdAndUpdate(req.params.id, req.body, { new: true })
      .select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const lastAppointment = await appModel
      .findOne({ patientId: updatedUser._id })
      .sort({ date: -1, time: -1 });

    res.json({
      data: {
        ...updatedUser._doc,
        age: calculateAge(updatedUser.dob),
        matric: lastAppointment?.matric || null,
        gender: lastAppointment?.gender || null,
        phonenumber: lastAppointment?.phonenumber || null,
        department: lastAppointment?.department || null,
        level: lastAppointment?.level || null,
        lastVisit: lastAppointment?.date || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating patient" });
  }
};

//Delete Patient
const deletePatient = async (req, res) => {
  try {
    const patientId = req.params.id;
    const deleted = await userModel.findByIdAndDelete(patientId);
    if (!deleted) {
      return res.status(404).json({ message: "Patient not found" });
    }

    //Delete related appointments
    await appModel.deleteMany({ patientId });

    //Delete related chat logs
    await chatModel.deleteMany({ patientId });
    res.json({ message: "Patient deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting patient" });
  }
};

// const uploadReport = async (req, res) => {
//   try {
//     const patient = await userModel.findById(req.params.id);
//     if (!patient) return res.status(404).json({ message: "Patient not found" });

//     // Save file info
//     patient.reports = patient.reports || [];
//     patient.reports.push({
//       filename: req.file.originalname,
//       path: req.file.path,
//     });

//     await patient.save();
//     res.json({ report: patient.reports[patient.reports.length - 1] });
//   } catch (err) {
//     res.status(500).json({ message: "Error uploading report" });
//   }
// };

const getChatLogs = async (req, res) => {
  try {
    const chatlogs = await chatModel
      .find({})
      .populate("userId", "firstname lastname") // only fetch first + last name
      .sort({ createdAt: -1 });

    const formattedLogs = chatlogs.map((log) => {
      const durationMinutes = 1;
      const aiAccuracy = log.aiAccuracy ?? 95;

      let adminRating = 1;
      if (aiAccuracy >= 90) adminRating = 5;
      else if (aiAccuracy >= 80) adminRating = 4;
      else if (aiAccuracy >= 70) adminRating = 3;
      else if (aiAccuracy >= 60) adminRating = 2;
      else adminRating = 1;

      return {
        _id: log._id,
        sessionId: log.sessionId,
        patientId: log.user?._id || "N/A",
        patientName: log.userId
          ? `${log.userId.firstname} ${log.userId.lastname}`
          : "Unknown",

        startTime: log.startTime || null,
        endTime: log.endTime || null,
        duration: `${durationMinutes} min`,
        messageCount: (log.messages || []).length,
        messages: (log.messages || []).map((m) => ({
          sender: m.role === "user" ? "patient" : "assistant",
          message: m.content,
          time: m.timestamp
            ? new Date(m.timestamp).toLocaleTimeString()
            : "N/A",
        })),
        keywords: log.keywords || [],
        aiAccuracy,
        adminRating: log.adminRating ?? adminRating,
        status: "completed",
      };
    });

    res.json({ formattedLogs });
  } catch (err) {
    console.error("Error fetching chat logs:", err);
    res.status(500).json({ message: "Error fetching chat logs" });
  }
};

module.exports = {
  adminLogin,
  adminLogout,
  adminDashboard,
  getAppointmentStats,
  getAllAppointments,
  updateAppointmentStatus,
  recentActivity,
  getAllActivities,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getChatLogs,
};
