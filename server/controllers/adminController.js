const User = require("../models/User");
const Attempt = require("../models/Attempt");

// @desc    Get all users with search & pagination
// @route   GET /api/users
exports.getUsersList = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;
    const search = (req.query.search || "").trim().toLowerCase();

    let query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const allUsersList = await User.find({});
    const totalUsersCount = allUsersList.length;
    const verifiedUsersCount = allUsersList.filter((u) => u.isVerified && u.role === "user").length;
    const adminUsersCount = allUsersList.filter((u) => u.role === "admin").length;

    const formattedUsers = users.map((u) => ({
      id: u._id,
      fullName: u.fullName,
      username: u.username,
      role: u.role,
      isVerified: u.isVerified,
      level: u.level,
      createdAt: u.createdAt,
    }));

    res.status(200).json({
      message: "لیست کاربران دریافت شد",
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
      users: formattedUsers,
      stats: {
        totalUsers: totalUsersCount,
        verifiedUsers: verifiedUsersCount,
        adminUsers: adminUsersCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: "خطا در دریافت لیست کاربران", error: error.message });
  }
};

// @desc    Find single user by ID
// @route   GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "کاربر یافت نشد" });
    }
    res.status(200).json({
      message: "اطلاعات کاربر با موفقیت دریافت شد",
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
    res.status(500).json({ message: "خطا در دریافت اطلاعات کاربر", error: error.message });
  }
};

// @desc    Update user authorization role
// @route   PATCH /api/users/:id/role
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "موقعیت نقش نامعتبر است" });
    }

    if (req.user._id.toString() === req.params.id && role !== "admin") {
      return res.status(400).json({ message: "شما نمی‌توانید دسترسی ادمین خود را لغو کنید" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "کاربر یافت نشد" });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      message: "نقش کاربر با موفقیت ویرایش شد",
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
        level: user.level,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "خطا در بروزرسانی نقش", error: error.message });
  }
};

// @desc    Update user verification status
// @route   PATCH /api/users/:id/verify
exports.updateUserVerification = async (req, res) => {
  try {
    const { isVerified } = req.body;
    if (typeof isVerified !== "boolean") {
      return res.status(400).json({ message: "وضعیت تایید باید true یا false باشد" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "کاربر یافت نشد" });
    }

    user.isVerified = isVerified;
    await user.save();

    res.status(200).json({
      message: "وضعیت تایید کاربر با موفقیت ویرایش شد",
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
        level: user.level,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "خطا در تایید کاربر", error: error.message });
  }
};

// @desc    Override student evaluated level
// @route   PATCH /api/users/:id/level
exports.updateUserLevel = async (req, res) => {
  try {
    const { level } = req.body;
    if (!level || typeof level !== "string") {
      return res.status(400).json({ message: "سطح انتخاب شده نامعتبر است" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "کاربر یافت نشد" });
    }

    user.level = level;
    await user.save();

    res.status(200).json({
      message: "سطح کاربر با موفقیت ویرایش شد",
      user: {
        id: user._id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
        level: user.level,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "خطا در ویرایش سطح", error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: "شما نمی‌توانید حساب کاربری خودتان را حذف کنید" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "کاربر مورد نظر یافت نشد" });
    }

    await User.findByIdAndDelete(req.params.id);
    // Remove their attempts
    await Attempt.deleteMany({ userId: req.params.id });

    res.status(200).json({ message: "کاربر با موفقیت از سیستم حذف شد" });
  } catch (error) {
    res.status(500).json({ message: "خطا در حذف کاربر", error: error.message });
  }
};
