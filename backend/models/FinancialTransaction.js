const mongoose = require("mongoose");

const FinancialTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ["INCOME", "EXPENSE"], required: true },
  vendor: { type: String, default: "Umum" },
  items: [{
    name: String,
    qty: { type: Number, default: 1 },
    price: Number,
    subtotal: Number,
    category: String
  }],
  totalAmount: { type: Number, required: true },
  source: { type: String, enum: ["chat", "image"], default: "chat" },
  rawText: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("FinancialTransaction", FinancialTransactionSchema);