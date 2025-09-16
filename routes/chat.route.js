const express = require("express");
const chatRouter = express.Router();
const {
  chatAssistant,
  logsAssistant,
} = require("../controllers/chat.controller");
const auth = require("../middleware/auth");

chatRouter.post("/message", auth, chatAssistant);
chatRouter.get("/logs", auth, logsAssistant);

module.exports = chatRouter;
