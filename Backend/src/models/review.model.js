const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now },
    visible: {
      type: Boolean,
      default: true,
    },
    flagged: { type: Boolean, default: false },
    replies: [
      {
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // nếu muốn biết ai trả lời
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
