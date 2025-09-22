const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Signup
const registerUser = async (req, res) => {
  const { firstname, lastname, email, password, dob, bloodgroup, address } =
    req.body;
  try {
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const form = new userModel({
      firstname,
      lastname,
      email,
      password,
      dob,
      bloodgroup,
      address,
    });
    await form.save();

    res
      .status(201)
      .json({ status: true, message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//Login
const confirmUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id, firstname: user.firstname },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.status(200).json({
      status: true,
      message: "User found",
      token,
      user: {
        firstname: user.firstname,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, message: "Internal server error" });
  }
};

//logout
const logoutUser = async (req, res) => {
  return res.status(200).json({ status: true, message: "Logged out" });
};

//Profile
const getProfile = async (req, res) => {
  try {
    const user = await userModel
      .findById(req.user.id)
      .select("firstname email role");
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }
    return res.status(200).json({
      status: true,
      user: {
        firstname: user.firstname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

//Request Password
const requestPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const now = Date.now();
    if (user.lastOtpRequest && now - user.lastOtpRequest < 60000) {
      return res.status(429).json({
        status: false,
        message: "Please wait before requesting a new code.",
      });
    }

    const resetCode = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetCode = resetCode;
    user.resetCodeExpires = now + 1 * 60 * 1000;
    user.lastOtpRequest = now;

    await user.save();

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: user.email,
      subject: "Password Reset Code",
      text: `Your reset code is: ${resetCode}`,
    };

    await transporter.sendMail(mailOptions);
    return res.json({ status: true, message: "Reset code sent to email" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

//Verify OTP
const verifyPassword = async (req, res) => {
  const { email, resetCode } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not registered" });
    }

    if (user.resetCodeExpires < Date.now()) {
      user.resetCode = null; // Clear expired code
      user.resetCodeExpires = null;
      return user.save().then(() => {
        res.status(400).json({
          status: false,
          message: "Reset code expired. Request a new one.",
        });
      });
    }

    if (String(user.resetCode) !== String(resetCode)) {
      console.log("invalid reset code");
      return res
        .status(400)
        .json({ status: false, message: "Invalid reset code" });
    }

    // Clear reset code after successful verification
    user.resetCode = null;
    user.resetCodeExpires = null;
    return user.save().then(() => {
      console.log("reset code verified");
      res.status(200).json({
        status: true,
        message: "Reset code verified. You can reset your password now.",
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = newPassword;
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, firstname: user.firstname },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    return res.status(200).json({
      status: true,
      message: "Password reset successful",
      firstname: user.firstname,
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

module.exports = {
  registerUser,
  confirmUser,
  logoutUser,
  getProfile,
  requestPassword,
  verifyPassword,
  resetPassword,
};
