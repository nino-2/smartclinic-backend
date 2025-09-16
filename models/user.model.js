const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: function () {
      return this.role === "patient";
    },
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  username: {
    type: String,
  },
  firstname: {
    type: String,
  },
  lastname: {
    type: String,
  },
  dob: {
    type: Date,
  },
  bloodgroup: {
    type: String,
  },
  address: {
    type: String,
  },
  role: {
    type: String,
    enum: ["patient", "admin"],
    default: "patient",
  },
  resetCode: { type: String, default: null },
  resetCodeExpires: { type: Date, default: null },

  refreshTokenHash: { type: String, default: null, select: false },
});

let saltRound = 10;
userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  console.log(this.password);
  bcrypt.hash(this.password, saltRound, (err, hashedPassword) => {
    if (err) return next(err);
    this.password = hashedPassword;
    next();
  });
});

userSchema.methods.validatePassword = function (password, callback) {
  bcrypt.compare(password, this.password, (err, same) => {
    if (!err) {
      console.log(same);
      callback(err, same);
    } else {
      next();
    }
  });
};

let userModel = mongoose.model("User", userSchema);
module.exports = userModel;
