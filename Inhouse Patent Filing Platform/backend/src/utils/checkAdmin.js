require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function main() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from backend/.env");
    }

    const email = String(process.env.ADMIN_EMAIL || "")
      .trim()
      .toLowerCase();
    const password = String(process.env.ADMIN_PASSWORD || "");

    if (!email || !password) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required in backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.log("ADMIN USER NOT FOUND");
      return;
    }

    console.log("--------------------------------");
    console.log("ADMIN FOUND");
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("Active:", user.isActive);
    console.log("Has password hash:", !!user.password);

    const passwordMatches = await bcrypt.compare(
      password,
      user.password || ""
    );

    console.log("Password matches:", passwordMatches);
    console.log("--------------------------------");
  } catch (error) {
    console.error("ERROR:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

main();
