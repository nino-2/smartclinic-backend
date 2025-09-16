require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const userModel = require("./models/user.model");

const URI = process.env.MONGODB_URI;

mongoose
  .connect(URI)
  .then(() => seedAdmin())
  .catch((err) => console.log("MongoDB connection error:", err));

const seedAdmin = async () => {
  try {
    // Remove existing admin(s) to avoid conflicts
    await userModel.deleteMany({ role: "admin" });
    console.log("Seeding admin with:");
    console.log("Username:", process.env.ADMIN_USERNAME);
    console.log("Password (plaintext):", process.env.ADMIN_PASSWORD);

    const newAdmin = await userModel.create({
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD, // plaintext
      role: "admin",
    });

    console.log("Admin account created successfully:", newAdmin.username);
  } catch (err) {
    console.error("Error seeding admin:", err);
  } finally {
    mongoose.disconnect();
  }
};
