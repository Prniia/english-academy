const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "فقط ادمین دسترسی دارد" });
};

module.exports = isAdmin;
