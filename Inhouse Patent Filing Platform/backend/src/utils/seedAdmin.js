require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("../config/db");
const User = require("../models/User");

(async () => {
  try {
    await db();

    const email = String(process.env.ADMIN_EMAIL || "")
      .trim()
      .toLowerCase();
    const password = String(process.env.ADMIN_PASSWORD || "");

    if (!email || !password) {
      throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required in backend/.env");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name: "PatentFlow Administrator",
          email,
          password: hashedPassword,
          role: "ADMIN",
          isActive: true,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log("Admin ready:", admin.email);
    process.exit(0);
  } catch (error) {
    console.error("Admin seed failed:", error);
    process.exit(1);
  }
})();
