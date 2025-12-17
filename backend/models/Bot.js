const mongoose = require("mongoose");

const BotSchema = new mongoose.Schema({
  uid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  connected: { type: Boolean, default: false },
  qr: String,
  phone: String,
  updatedAt: Date,
});

module.exports = mongoose.model("Bot", BotSchema);
