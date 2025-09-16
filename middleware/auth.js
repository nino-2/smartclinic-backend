const jwt = require("jsonwebtoken");
const auth = (req, res, next) => {
  const bearer = req.headers.authorization?.split(" ")[1];
  const token = bearer || req.cookies?.accessToken;
  console.log("Incoming token:", token);
  if (!token) return res.status(400).json({ message: "Access Denied" });
  //   if (!token) return res.send({ status: false, message: "Access Denied" });
  try {
    const secret = process.env.JWT_SECRET;
    const decode = jwt.verify(token, secret);
    req.user = decode;
    next();
  } catch (err) {
    res
      .status(401)
      .json({ status: false, message: "Invalid Token", error: err.message });
  }
};

module.exports = auth;
