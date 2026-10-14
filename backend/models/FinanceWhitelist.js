const mongoose = require("mongoose");

const FinanceWhitelistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  phone: {
    type: String,
    required: true,
    index: true,
  },
  label: {
    type: String,
    default: "Owner",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

FinanceWhitelistSchema.index({ userId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model("FinanceWhitelist", FinanceWhitelistSchema);
