// middlewares/activityLogger
const activityModel = require("../models/activity.model");

// middleware/activityLogger.js
const activityLogger = async (req, res, next) => {
  try {
    if (!req.admin) return next();

    const { _id } = req.admin;
    const { method, originalUrl } = req;

    // log action (insert into DB)
    await activityModel.create({
      user: _id,
      description: `${method} ${originalUrl}`,
    });
  } catch (err) {
    console.error("Activity logger failed:", err);
    // Don't block the request
  }
  next();
};

module.exports = { activityLogger };
