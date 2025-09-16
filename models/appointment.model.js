const mongoose = require("mongoose");
const appSchema = mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  firstname: { type: String },
  lastname: { type: String },
  matric: {
    type: String,
  },
  department: {
    type: String,
  },
  level: {
    type: String,
  },
  gender: {
    type: String,
  },
  phonenumber: {
    type: String,
  },

  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
  },
  reasontype: {
    type: String,
  },
  reasondetails: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled", "rescheduled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

let appModel = mongoose.model("Appointment", appSchema);
module.exports = appModel;
