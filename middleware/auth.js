const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    // First, check for Bearer token in header
    const bearer = req.headers.authorization?.split(" ")[1];
    // If not found, check for accessToken cookie
    const token = bearer || req.cookies?.accessToken;

    console.log("Incoming token:", token);

    if (!token) {
      return res.status(401).json({ status: false, message: "Access Denied" });
    }

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: "Invalid or expired token",
      error: err.message,
    });
  }
};

module.exports = auth;
