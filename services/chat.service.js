const chatModel = require("../models/chat.model");
const { classifyIsHealth, answerHealth } = require("../services/gemini");
const { v4: uuidv4 } = require("uuid");

const handleChat = async (userId, message, sessionId) => {
  try {
    let reply;

    // special greetings
    if (/^\s*(hello|hi|hey)\b/i.test(message)) {
      reply = "Hi! I'm MAPOLY SmartClinic Assistant. How can I help you today?";
    } else {
      const isHealth = await classifyIsHealth(message);
      if (!isHealth) {
        reply =
          "I can only help with health-related questions. Try asking about symptoms, self-care, or clinic services.";
      } else {
        reply = await answerHealth(message);
      }
    }

    if (!sessionId) {
      //  no new const, just reassign
      sessionId = uuidv4();
      const chatlog = await chatModel.create({
        sessionId,
        userId,
        messages: [
          { role: "user", content: message },
          { role: "assistant", content: reply },
        ],
        startTime: new Date(),
      });
      return { reply, chatId: chatlog._id, sessionId };
    } else {
      //  now this will work, since sessionId is not unique in schema
      const chatlog = await chatModel.findOneAndUpdate(
        { sessionId, userId },
        {
          $push: {
            messages: [
              { role: "user", content: message },
              { role: "assistant", content: reply },
            ],
          },
          $set: { updatedAt: new Date() },
        },
        { new: true }
      );
      return { reply, chatId: chatlog._id, sessionId };
    }
  } catch (error) {
    console.error("handleChat error:", error);
    throw error;
  }
};

module.exports = { handleChat };
