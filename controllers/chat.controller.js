const chatModel = require("../models/chat.model");
const { handleChat } = require("../services/chat.service");

//chat
const chatAssistant = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const result = await handleChat(req.user.id, message, sessionId);
    res.json({
      status: true,
      reply: result.reply,
      chatId: result.chatId,
      sessionId: result.sessionId,
    });
  } catch (error) {
    res.status(500).json({ status: false, message: "server error" });
  }
};

// Chat logs
const logsAssistant = async (req, res) => {
  try {
    let logs;
    if (req.user.role === "admin") {
      logs = await chatModel
        .find()
        .populate("userId", "firstname lastname email");
    } else {
      logs = await chatModel.find({ userId: req.user.id });
    }
    res.json({ status: true, logs });
  } catch (error) {
    res.status(500).json({ status: false, message: "server error" });
  }
};

module.exports = { chatAssistant, logsAssistant };
