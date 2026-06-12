const jwt = require("jsonwebtoken");
const User = require("../models/User");

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "توکن ارسال نشده است یا نامعتبر است" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "placement-test-secret-key-928374923");
    
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "کاربر یافت نشد" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "توکن نامعتبر یا منقضی شده است", error: error.message });
  }
};

module.exports = requireAuth;
