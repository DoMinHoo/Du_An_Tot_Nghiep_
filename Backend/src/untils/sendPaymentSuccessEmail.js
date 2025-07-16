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
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Hình ảnh</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tên sản phẩm</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Số lượng</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Đơn giá</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Thành tiền</th>
                        </tr>
                    </thead>
                    <tfoot>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;" colspan="4">Tổng cộng</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left">${order.totalAmount.toLocaleString('vi-VN')} VNĐ</th>
                        </tr>
                    </tfoot>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 8px;">
                                    <img src="cid:${item.variationId._id}" alt="${item.variationId.name}" style="width: 100px; height: auto;">
                                </td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${item.variationId.name}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${item.quantity}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${item.salePrice.toLocaleString('vi-VN')} VNĐ</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${(item.salePrice * item.quantity).toLocaleString('vi-VN')} VNĐ</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p>Nếu bạn có câu hỏi, vui lòng liên hệ <a href="mailto:${process.env.EMAIL_USER1}">${process.env.EMAIL_USER1}</a> hoặc <a href="tel:${process.env.PHONE_NUMBER}">${process.env.PHONE_NUMBER}</a>.</p>
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
            subject: 'Xác nhận thanh toán thành công - Đơn hàng #' + order.orderCode,
           html: `
                <h2 style="color: #2c3e50;">Cảm ơn bạn đã mua sắm!</h2>
                <p>Chào ${order.shippingAddress.fullName},</p>
                <p>Chúng tôi xin thông báo rằng thanh toán cho đơn hàng <strong>#${order.orderCode}</strong> đã được thực hiện thành công.</p>
                <hh3>Thông tin đơn hàng:</h3>
                <ul>
                    <li><strong>Mã đơn hàng:</strong> ${order.orderCode}</li>
                    <li><strong>Tổng tiền:</strong> ${order.totalAmount.toLocaleString('vi-VN')} VNĐ</li>
                    <li><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'online_payment' ? 'Thanh toán trực tuyến' : order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}</li>
                    <li><strong>Trạng thái:</strong> ${order.status}</li>
                </ul>
                <h3>Chi tiết sản phẩm:</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Hình ảnh</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tên sản phẩm</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Số lượng</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Đơn giá</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Thành tiền</th>
                        </tr>
                    </thead>
                    <tfoot>
                        <tr style="background-color: #f2f2f2;">
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;" colspan="4">Tổng cộng</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left">${order.totalAmount.toLocaleString('vi-VN')} VNĐ</th>
                        </tr>
                    </tfoot>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 8px;">
                                    <img src="cid:${item.variationId._id}" alt="${item.variationId.name}" style="width: 100px; height: auto;">
                                </td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${item.variationId.name}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${item.quantity}</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${item.salePrice.toLocaleString('vi-VN')} VNĐ</td>
                                <td style="border: 1px solid #ddd; padding: 8px;">${(item.salePrice * item.quantity).toLocaleString('vi-VN')} VNĐ</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p>Nếu bạn có câu hỏi, vui lòng liên hệ <a href="mailto:${process.env.EMAIL_USER1}">${process.env.EMAIL_USER1}</a> hoặc <a href="tel:${process.env.PHONE_NUMBER}">${process.env.PHONE_NUMBER}</a>.</p>
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
