const mongoose = require("mongoose");

const BusinessProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    products: [
      {
        name: String,
        description: String,
        price: String, // string biar fleksibel
      },
    ],

    faq: [
      {
        question: String,
        answer: String,
      },
    ],

    tone: {
      type: String,
      enum: ["formal", "ramah", "santai"],
      default: "ramah",
    },

    adminContact: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "BusinessProfile",
  BusinessProfileSchema
);
