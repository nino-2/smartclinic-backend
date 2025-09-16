const express = require("express");
const userRouter = express.Router();
const {
  registerUser,
  confirmUser,
  logoutUser,
  getProfile,
  requestPassword,
  verifyPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const auth = require("../middleware/auth");
const { activityLogger } = require("../middleware/activityLogger");

userRouter.post("/signup", registerUser, activityLogger);
userRouter.post("/login", confirmUser);
userRouter.post("/logout", auth, logoutUser);
userRouter.get("/profile", auth, getProfile);
userRouter.post("/request", requestPassword);
userRouter.post("/verify", verifyPassword);
userRouter.post("/reset", resetPassword);

module.exports = userRouter;
