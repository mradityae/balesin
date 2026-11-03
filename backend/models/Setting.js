const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  pricePerDay: { type: Number, default: 2000 },
  oldPrice: { type: String, default: "250k" },
  activePromoText: { type: String, default: "Otomatis Whitelist WA" }
}, { timestamps: true });

module.exports = mongoose.model("Setting", settingSchema);