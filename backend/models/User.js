const mongoose = require("mongoose");
const crypto = require("crypto");

module.exports = mongoose.model("User", new mongoose.Schema({
  name: {type: String, required:true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: "user" },
  isActive: { type: Boolean, default: true },
  subscribedUntil: { type: Date },
  shareToken: { 
    type: String, 
    default: () => crypto.randomBytes(8).toString("hex") 
  },
}, { timestamps: true }));
