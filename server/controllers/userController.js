const User = require("../models/User");
const Attempt = require("../models/Attempt");

// @desc    Get current user profile Info
// @route   GET /api/users/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "کاربر یافت نشد" });
    }
    res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
        level: user.level,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "خطا در دریافت پروفایل", error: error.message });
  }
};

// @desc    Get current user attempts
// @route   GET /api/users/me/attempts
exports.getMyAttempts = async (req, res) => {
  try {
    const attempts = await Attempt.find({ userId: req.user.id })
      .populate("testId", "title duration")
      .sort({ createdAt: -1 });

    res.status(200).json({ attempts });
  } catch (error) {
    res.status(500).json({ message: "خطا در دریافت نتایج آزمون شما", error: error.message });
  }
};
