require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/english-pro");

    console.log("MongoDB connected");

    const users = [
      {
        fullName: "مدیر ارشد سیستم",
        username: "admin",
        password: "admin123",
        role: "admin",
        isVerified: true,
        level: "نامشخص"
      },
      {
        fullName: "علی محمدی",
        username: "ali",
        password: "user123",
        role: "user",
        isVerified: true,
        level: "B2"
      },
      {
        fullName: "سارا احمدی",
        username: "sara",
        password: "user123",
        role: "user",
        isVerified: false,
        level: "A1"
      }
    ];

    for (const userData of users) {
      let user = await User.findOne({ username: userData.username });

      if (user) {
        user.fullName = userData.fullName;
        user.password = userData.password;
        user.role = userData.role;
        user.isVerified = userData.isVerified;
        user.level = userData.level;

        await user.save();

        console.log(`Updated user: ${userData.username}`);
      } else {
        await User.create(userData);

        console.log(`Created user: ${userData.username}`);
      }
    }

    console.log("Seed completed");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seedUsers();
