const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader && !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: false, message: "Access Denied" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ status: false, message: "Invalid token" });
  }
};

module.exports = auth;
