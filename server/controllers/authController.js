const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || "placement-test-secret-key-928374923",
    { expiresIn: "7d" }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { fullName, username, password } = req.body;

    if (!fullName || !username || !password) {
      return res.status(400).json({ message: "همه فیلدها الزامی هستند" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "رمز عبور باید حداقل ۶ کاراکتر باشد" });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const existingUser = await User.findOne({ username: normalizedUsername });

    if (existingUser) {
      return res.status(400).json({ message: "این نام کاربری قبلاً ثبت شده است" });
    }

    const user = await User.create({
      fullName: fullName.trim(),
      username: normalizedUsername,
      password, // Password hashing is handled by pre-save middleware in Model
      role: req.body.role || "user",
      isVerified: req.body.isVerified !== undefined ? req.body.isVerified : false,
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: "ثبت نام با موفقیت انجام شد",
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
        level: user.level,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "خطا در ثبت نام", error: error.message });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "نام کاربری و رمز عبور الزامی هستند" });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: normalizedUsername });

    if (!user) {
      return res.status(404).json({ message: "کاربر یافت نشد" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "رمز عبور اشتباه است" });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: "ورود با موفقیت انجام شد",
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
        level: user.level,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "خطا در ورود", error: error.message });
  }
};
