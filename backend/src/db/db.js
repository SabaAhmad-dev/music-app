const mongoose = require("mongoose");

async function connectDB() {
  if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is not defined");
  }

  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("DB connected");
  } catch (err) {
    console.log("Database connection error", err);
    throw err;
  }
}

module.exports = connectDB;