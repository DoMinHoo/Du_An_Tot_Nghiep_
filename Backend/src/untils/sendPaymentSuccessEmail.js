const nodemailer = require('nodemailer');
const Order = require('../models/order.model');
const path = require('path');
require('dotenv').config();
// ✅ Hàm kiểm tra định dạng email
const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

// ✅ Hàm tạo token đơn giản từ email
const generateToken = (email) => {
    const timestamp = new Date().getTime();
    return Buffer.from(`${email}:${timestamp}`).toString('base64');
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER1,
        pass: process.env.EMAIL_PASS1,
    },
    tls: {
        rejectUnauthorized: false // Bỏ qua lỗi chứng chỉ SSL (chỉ dùng trong môi trường phát triển)
    }
});

// Hàm gửi email xác nhận thanh toán thành công
const sendPaymentSuccessEmail = async (orderId) => {
    try {
        const order = await Order.findById(orderId).populate('items.variationId');
        if (!order) throw new Error('Đơn hàng không tồn tại');
        if (order.paymentStatus !== 'completed') throw new Error('Thanh toán chưa hoàn tất');
 // Kiểm tra email người dùng
    const email = order.shippingAddress.email;
    if (!isValidEmail(email)) {
        throw new Error(`Email khách hàng không hợp lệ: ${email}`);
    }
        const mailOptions = {
            from: process.env.EMAIL_USER1,
            to: email,
            subject: 'Xác nhận thanh toán thành công - Đơn hàng #' + order.orderCode,
            html: `
                <h2 style="color: #2c3e50;">Cảm ơn bạn đã mua sắm!</h2>
                <p>Chào ${order.shippingAddress.fullName},</p>
                <p>Chúng tôi xin thông báo rằng thanh toán cho đơn hàng <strong>#${order.orderCode}</strong> đã được thực hiện thành công.</p>
                <h3>Thông tin đơn hàng:</h3>
                <ul>
                    <li><strong>Mã đơn hàng:</strong> ${order.orderCode}</li>
                    <li><strong>Tổng tiền:</strong> ${order.totalAmount.toLocaleString('vi-VN')} VNĐ</li>
                    <li><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'online_payment' ? 'Thanh toán trực tuyến' : order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}</li>
                    <li><strong>Trạng thái:</strong> ${order.status}</li>
                </ul>
                <h3>Chi tiết sản phẩm:</h3>
                ${order.items.map(item => `
                    <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px;">
                        <img src="cid:${item.variationId._id}" alt="${item.variationId.name}" style="width: 100px; height: auto;">
                        <p><strong>Tên sản phẩm:</strong> ${item.variationId.name}</p>
                        <p><strong>Số lượng:</strong> ${item.quantity}</p>
                        <p><strong>Đơn giá:</strong> ${item.salePrice.toLocaleString('vi-VN')} VNĐ</p>
                        <p><strong>Thành tiền:</strong> ${(item.salePrice * item.quantity).toLocaleString('vi-VN')} VNĐ</p>
                    </div>
                `).join('')}
                <p>Nếu bạn có câu hỏi, vui lòng liên hệ <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a> hoặc ${order.shippingAddress.phone}.</p>
                <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
            `,
            attachments: order.items.map(item => ({
                filename: item.variationId.name + '.jpg',
                path: path.join(__dirname, `../${item.variationId.colorImageUrl}`),
                cid: item.variationId._id.toString(),
            })),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return { success: true, message: 'Email xác nhận đã được gửi' };
    } catch (error) {
        console.error('Lỗi gửi email:', error);
        throw new Error('Gửi email thất bại: ' + error.message);
    }
};

// Hàm gửi email xác nhận giao hàng
const sendOrderSuccessEmail = async (orderId) => {
    try {
        const order = await Order.findById(orderId).populate('items.variationId');
        if (!order) throw new Error('Đơn hàng không tồn tại');
        if (order.paymentMethod !== 'cod') throw new Error('Chỉ áp dụng cho đơn hàng COD');

        const confirmUrl = `http://localhost:5000/api/orders/confirm-delivery/${orderId}?token=${generateToken(order.shippingAddress.email)}`;
        const rejectUrl = `http://localhost:5000/api/orders/reject-order/${orderId}?token=${generateToken(order.shippingAddress.email)}`;
         // Kiểm tra email người dùng
            const email = order.shippingAddress.email;
        const isValidEmail = (email) => {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(email);
        };
        if (!isValidEmail(email)) {
            throw new Error(`Email khách hàng không hợp lệ: ${email}`);
    }
        const mailOptions = {
            from: process.env.EMAIL_USER1,
            to: email,
            subject: 'Xác nhận giao hàng - Đơn hàng #' + order.orderCode,
            html: `
                <h2 style="color: #2c3e50;">Thông báo giao hàng!</h2>
                <p>Chào ${order.shippingAddress.fullName},</p>
                <p>Đơn hàng <strong>#${order.orderCode}</strong> của bạn đang được giao. Vui lòng xác nhận hoặc từ chối nhận hàng trực tiếp qua các liên kết dưới đây.</p>
                <h3>Thông tin đơn hàng:</h3>
                <ul>
                    <li><strong>Mã đơn hàng:</strong> ${order.orderCode}</li>
                    <li><strong>Tổng tiền:</strong> ${order.totalAmount.toLocaleString('vi-VN')} VNĐ</li>
                    <li><strong>Phương thức thanh toán:</strong> Thanh toán khi nhận hàng</li>
                    <li><strong>Trạng thái:</strong> ${order.status}</li>
                </ul>
                <h3>Sản phẩm của bạn:</h3>
                ${order.items.map(item => `
                    <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px;">
                        <img src="cid:${item.variationId._id}" alt="${item.variationId.name}" style="width: 100px; height: auto;">
                        <p><strong>Tên sản phẩm:</strong> ${item.variationId.name}</p>
                        <p><strong>Số lượng:</strong> ${item.quantity}</p>
                        <p><strong>Đơn giá:</strong> ${item.salePrice.toLocaleString('vi-VN')} VNĐ</p>
                        <p><strong>Thành tiền:</strong> ${(item.salePrice * item.quantity).toLocaleString('vi-VN')} VNĐ</p>
                    </div>
                `).join('')}
                <p><strong>Hành động:</strong> Vui lòng nhấp vào một trong các liên kết sau để xử lý:</p>
                <a href="${confirmUrl}" style="background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Xác nhận nhận hàng</a>
                <a href="${rejectUrl}" style="background-color: #ff4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Từ chối nhận hàng</a>
                <p>Lưu ý: Các liên kết chỉ hợp lệ trong 24 giờ. Nếu bạn có câu hỏi, vui lòng liên hệ <a href="mailto:${process.env.EMAIL_USER1}">${process.env.EMAIL_USER1}</a> hoặc ${order.shippingAddress.phone}.</p>
                <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
            `,
            attachments: order.items.map(item => ({
                filename: item.variationId.name + '.jpg',
                path: path.join(__dirname, `../${item.variationId.colorImageUrl}`),
                cid: item.variationId._id.toString(),
            })),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return { success: true, message: 'Email xác nhận giao hàng đã được gửi' };
    } catch (error) {
        console.error('Lỗi gửi email:', error);
        throw new Error('Gửi email thất bại: ' + error.message);
    }
};

module.exports = { sendPaymentSuccessEmail, sendOrderSuccessEmail };