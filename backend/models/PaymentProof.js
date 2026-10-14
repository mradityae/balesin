const mongoose = require("mongoose");

const PaymentProofSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  imageUrl: { type: String, required: true },
  
  // Data Baru dari Dashboard
  planName: { type: String },
  duration: { type: Number },
  totalPaid: { type: Number },
  bankDestination: { type: String },
  accountNumber: { type: String },
  accountName: { type: String },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "expired"],
    default: "pending",
  },
  note: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PaymentProof", PaymentProofSchema);