
const Payment = require('../models/payment.model');
const Order = require('../models/order.model');



const createPayment = async (req, res) => {
    try {
        // Validate dữ liệu đầu vào bằng Joi
        const { error, value } = paymentSchema.validate(req.body);
        if (error) {
            // Nếu có lỗi validate, trả về thông báo lỗi
            return res.status(400).json({ message: error.details[0].message });
        }

        // Kiểm tra xem orderId có tồn tại trong bảng Order hay không
        const order = await Order.findById(value.orderId);
        if (!order) {
            return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
        }
        const generateTransactionCode = () => {
            // Tạo mã giao dịch duy nhất bằng cách kết hợp timestamp và chuỗi ngẫu nhiên
            return 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        };
        const existingPayment = await Payment.findOne({ transactionCode });
        if (existingPayment) {
            return res.status(400).json({ message: 'Mã giao dịch đã tồn tại' });
        }

        // Tạo transactionCode ngẫu nhiên nếu chưa có
        const transactionCode = generateTransactionCode();

        // Tạo mới thanh toán
        const payment = new Payment({
            ...value,
            transactionCode
        });

        // Lưu thanh toán vào cơ sở dữ liệu
        await payment.save();

        // Trả về kết quả thanh toán
        return res.status(201).json({
            message: 'Thanh toán thành công',
            payment
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

const getPayments = async (req, res) => {
    try {
        // Tìm tất cả thanh toán và populate thông tin của orderId
        const payments = await Payment.find().populate('orderId');

        // Trả về danh sách thanh toán
        return res.status(200).json({ payments });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID từ params của URL
        // Tìm thanh toán theo ID và populate orderId nếu cần
        const payment = await Payment.findById(id).populate('orderId');

        if (!payment) {
            return res.status(404).json({ message: 'Thanh toán không tồn tại' });
        }

        // Trả về thanh toán
        return res.status(200).json({ payment });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

const updatePayment = async (req, res) => {
    try {
        const { error, value } = paymentSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const payment = await Payment.findByIdAndUpdate(req.params.id, value, { new: true });
        if (!payment) {
            return res.status(404).json({ message: 'Thanh toán không tồn tại' });
        }

        return res.status(200).json({
            message: 'Cập nhật thanh toán thành công',
            payment
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

module.exports = {
    createPayment,
    getPayments,
    getPaymentById,
    updatePayment
};