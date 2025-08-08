const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    variationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariation",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    salePrice: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "shipping", "completed", "canceled", "confirmed"],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    addressLine: { type: String, required: true },
    street: { type: String, required: true },
    province: { type: String, required: true },
    district: { type: String, required: true },
    ward: { type: String, required: true },
    zipCode: { type: String },
    country: { type: String, default: "Vietnam" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: false,
    },
    orderCode: {
      type: String,
      required: true,
      unique: true,
    },
    // THÊM CÁC TRƯỜNG MỚI ĐỂ LƯU THÔNG TIN KHÁCH HÀNG ĐẶT HÀNG
    customerName: { type: String, required: false },
    customerEmail: { type: String, required: false },
    customerPhone: { type: String, required: false },
    // KẾT THÚC CÁC TRƯỜNG MỚI

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "shipping", "completed", "canceled", "confirmed"],
      default: "pending",
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "bank_transfer", "online_payment"],
      required: true,
    },
    cancellationReason: {
      type: String,
      default: "",
    },
    app_trans_id: { type: String, unique: true },
    paymentTransactionId: { type: String },

    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed",'refunded', 'expired'],
      default: "pending",
    },
    promotion: {
      code: { type: String },
      discountType: {
        type: String,
        enum: ["percentage", "fixed"],
        default: null,
      },
      discountValue: { type: Number, default: 0 },
    },
    items: [itemSchema],
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Các chỉ mục
orderSchema.index({ orderCode: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ "items.variationId": 1 });
orderSchema.index({ cartId: 1 });

module.exports = mongoose.model("Order", orderSchema);
