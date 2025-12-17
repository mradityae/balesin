const mongoose = require("mongoose");

module.exports = mongoose.model("User", new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: "user" },
  isActive: { type: Boolean, default: true },
  subscribedUntil: { type: Date }
}, { timestamps: true }));
