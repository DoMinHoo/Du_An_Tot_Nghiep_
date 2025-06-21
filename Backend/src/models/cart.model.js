const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
    {
        variationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductVariation',
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    { _id: false }
);

const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false, // Cho phép null cho guest
        },
        guestId: {
            type: String,
            required: false, // Định danh tạm thời cho guest
        },
        items: [cartItemSchema],
    },
    {
        timestamps: true,
        versionKey: false,
    }
);


module.exports = mongoose.model('Cart', cartSchema);