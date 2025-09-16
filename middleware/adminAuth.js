const jwt = require("jsonwebtoken");

const adminAuth = (req, res, next) => {
  console.log("All cookies:", req.cookies);
  const token = req.cookies?.adminToken;
  console.log("AdminToken cookie:", token);
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded admin token:", decoded);
    if (decoded.role !== "admin")
      return res.status(403).json({ message: "Forbidden" });

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = adminAuth;
