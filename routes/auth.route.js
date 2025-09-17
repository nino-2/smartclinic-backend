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

userRouter.post("/signup", registerUser);
userRouter.post("/login", confirmUser);
userRouter.post("/logout", auth, logoutUser);
userRouter.get("/profile", auth, getProfile);
userRouter.post("/request", requestPassword);
userRouter.post("/verify", verifyPassword);
userRouter.post("/reset", resetPassword);

module.exports = userRouter;
