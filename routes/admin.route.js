const express = require("express");
const adminRouter = express.Router();
const {
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
} = require("../controllers/admin.controller");
const multer = require("multer");
const adminAuth = require("../middleware/adminAuth");

// Multer config for file uploads
const upload = multer({ dest: "uploads/" });
const { activityLogger } = require("../middleware/activityLogger");

//Auth
adminRouter.post("/login", adminLogin);
adminRouter.post("/logout", adminAuth, adminLogout);

// Dasboard & Stats
adminRouter.get("/dashboard", adminAuth, adminDashboard);
adminRouter.get("/stats", adminAuth, getAppointmentStats);

// Appointments
adminRouter.get("/appointments", adminAuth, getAllAppointments);
adminRouter.patch(
  "/appointments/:id",
  adminAuth,
  // activityLogger,
  updateAppointmentStatus
);

// Recent Activity
adminRouter.get("/activity", adminAuth, recentActivity);
adminRouter.get("/allactivity", adminAuth, getAllActivities);

//Patient Record
adminRouter.get("/patients", adminAuth, getAllPatients);
adminRouter.get("/patients/:id", adminAuth, getPatientById);
adminRouter.put("/patients/:id", adminAuth, updatePatient);
adminRouter.delete("/patients/:id", adminAuth, deletePatient);
// adminRouter.post(
//   "/patients/:id/upload",
//   adminAuth,
//   upload.single("file"),
//   uploadReport
// );

//Chat Logs
adminRouter.get("/chatlogs", adminAuth, getChatLogs);
// adminRouter.get("/chatlogs/:id", adminAuth, getChatLogById);

module.exports = adminRouter;
