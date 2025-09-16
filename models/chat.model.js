// models/chatlog.model.js
const mongoose = require("mongoose");

const ChatLogSchema = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sessionId: { type: String, required: true },
  messages: [
    {
      role: {
        type: String,
        enum: ["system", "user", "assistant"],
        required: true,
      },
      content: { type: String },
      contentType: { type: String, enum: ["text", "audio"], default: "text" },
      audioUrl: { type: String },
      timestamp: { type: Date, default: Date.now },
      flagged: { type: Boolean, default: false },
      meta: { type: mongoose.Schema.Types.Mixed },
    },
  ],
  model: { type: String, default: "gemini" },
  aiAccuracy: { type: Number, default: 95 },
  durationMinutes: { type: Number, default: 0 },

  adminRating: { type: Number },
  isHealthConversation: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

let chatModel = mongoose.model("ChatLog", ChatLogSchema);
module.exports = chatModel;
