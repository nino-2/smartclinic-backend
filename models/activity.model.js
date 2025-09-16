const mongoose = require("mongoose");
const activitySchema = mongoose.Schema({
  type: {
    type: String,
    enum: ["registration", "appointment", "chat", "alert", "other"],
    default: "other",
  },
  description: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

let activityModel = mongoose.model("activity", activitySchema);
module.exports = activityModel;
