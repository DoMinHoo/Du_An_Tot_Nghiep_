const mongoose = require('mongoose');

// Định nghĩa Schema cho bảng "payment"
const paymentSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order', // Tham chiếu tới bảng Order
        required: true
    },
    method: {
        type: String,
        enum: ['cod', 'momo', 'bank_transfer'], // Các phương thức thanh toán: COD, MoMo, Chuyển khoản ngân hàng
        required: true
    },
    transactionCode: {
        type: String, // Mã giao dịch (nếu có)
        required: false
    },
    status: {
        type: String,
        enum: ['success', 'failed', 'pending'], // Trạng thái giao dịch
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Tạo và xuất mô hình "Payment"
module.exports = mongoose.model('Payment', paymentSchema);
