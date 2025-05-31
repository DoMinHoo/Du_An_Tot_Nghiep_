const mongoose = require('mongoose');

// Định nghĩa Schema cho bảng "products"
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    descriptionShort: { type: String, required: true },
    descriptionLong: { type: String, required: true },
    material: { type: String, required: true },
    dimensions: { type: String, required: true },
    weight: { type: Number, required: true },
    price: { type: Number, required: true },
    importPrice: { type: Number, required: true },
    salePrice: { type: Number },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    flashSale_discountedPrice: { type: Number },
    flashSale_start: { type: Date },
    flashSale_end: { type: Date },
    image: { type: [String], default: [] },
    totalPurchased: { type: Number, default: 0 },
    stock_quantity: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['active', 'hidden', 'sold_out'],
        default: 'active'
    }
}, {
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Product', productSchema);
