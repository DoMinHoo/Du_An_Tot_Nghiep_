const nodemailer = require('nodemailer');
const Order = require('../models/order.model');
const path = require('path');
require('dotenv').config();

// ✅ Hàm kiểm tra định dạng email
const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

// ✅ Hàm tạo token đơn giản từ email (chưa sử dụng, giữ nguyên)
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
        const newStatus = order.status;
        const email = order.shippingAddress.email;
        if (!isValidEmail(email)) {
            throw new Error(`Email khách hàng không hợp lệ: ${email}`);
        }
        let statusMessage;
        let subject = `Cập nhật trạng thái đơn hàng #${order.orderCode}`;
        switch (newStatus) {
            case 'pending':
                statusMessage = 'Cảm ơn bạn đã đặt hàng! Đơn hàng của bạn đã được thanh toán đơn hàng thành công và đang chờ xử lý.';
                subject = `Xác nhận đặt hàng thành công #${order.orderCode}`;
                break;
        }

        // Tính tổng giá sản phẩm
        const totalItemsPrice = order.items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);

        // Xử lý giá khuyến mãi
        let discountText = '';
        if (order.promotion && order.promotion.discountValue > 0) {
            if (order.promotion.discountType === 'percentage') {
                discountText = `Giảm ${order.promotion.discountValue}%${order.promotion.code ? ` (${order.promotion.code})` : ''}`;
            } else if (order.promotion.discountType === 'fixed') {
                discountText = `Giảm ${order.promotion.discountValue.toLocaleString('vi-VN')} VNĐ${order.promotion.code ? ` (${order.promotion.code})` : ''}`;
            }
        }

        const mailOptions = {
            from: process.env.EMAIL_USER1,
            to: email,
            subject: subject,
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Roboto', Arial, sans-serif; color: #333;">
                    <h2 style="color: #1a73e8; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">
                        ${newStatus === 'pending' ? 'Xác nhận đặt hàng' : 'Cập nhật trạng thái đơn hàng'}
                    </h2>
                    <p style="line-height: 1.6; margin-bottom: 20px;">Chào ${order.shippingAddress.fullName},</p>
                    <p style="line-height: 1.6; margin-bottom: 20px;">${statusMessage}</p>
                    <h3 style="color: #1a73e8; margin-bottom: 15px;">Thông tin đơn hàng:</h3>
                    <ul style="list-style: none; padding-left: 0; margin-bottom: 20px;">
                        <li style="margin-bottom: 10px;"><strong>Mã đơn hàng:</strong> ${order.orderCode}</li>
                        <li style="margin-bottom: 10px;"><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'online_payment' ? 'Thanh toán trực tuyến' : order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}</li>
                        <li style="margin-bottom: 10px;"><strong>Trạng thái:</strong> ${newStatus}</li>
                        <li style="margin-bottom: 10px;"><strong>Địa chỉ giao hàng:</strong>  ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}</li>
                        <li style="margin-bottom: 10px;"><strong>Địa chị nhận hàng:</strong>${order.shippingAddress.addressLine},</li>
                        <li style="margin-bottom: 10px;"><strong>Số điện thoại:</strong> ${order.shippingAddress.phone}</li>
                    </ul>
                    <h3 style="color: #1a73e8; margin-bottom: 15px;">Chi tiết sản phẩm:</h3>
                    <table style="width: 100%; max-width: 600px; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #f5f6fa;">
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: bold; color: #333;">Hình ảnh</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: bold; color: #333;">Tên sản phẩm</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: bold; color: #333;">Số lượng</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: bold; color: #333;">Đơn giá</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: bold; color: #333;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td style="border: 1px solid #e0e0e0; padding: 12px;">
                                        <img src="cid:${item.variationId._id}" alt="${item.variationId.name}" style="width: 80px; height: auto; display: block;">
                                    </td>
                                    <td style="border: 1px solid #e0e0e0; padding: 12px;">${item.variationId.name}</td>
                                    <td style="border: 1px solid #e0e0e0; padding: 12px;">${item.quantity}</td>
                                    <td style="border: 1px solid #e0e0e0; padding: 12px;">${item.salePrice.toLocaleString('vi-VN')} VNĐ</td>
                                    <td style="border: 1px solid #e0e0e0; padding: 12px;">${(item.salePrice * item.quantity).toLocaleString('vi-VN')} VNĐ</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background-color: #f5f6fa;">
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: normal;" colspan="4">Tổng giá sản phẩm</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left;">${totalItemsPrice.toLocaleString('vi-VN')} VNĐ</th>
                            </tr>
                            <tr style="background-color: #f5f6fa;">
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: normal;" colspan="4">Phí vận chuyển</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left;">${(order.shippingFee || 0).toLocaleString('vi-VN')} VNĐ</th>
                            </tr>
                            ${discountText ? `
                            <tr style="background-color: #f5f6fa;">
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: normal;" colspan="4">Khuyến mãi</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left;">${discountText}</th>
                            </tr>
                            ` : ''}
                            <tr style="background-color: #f5f6fa;">
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: bold; color: #2ecc71;" colspan="4">Tổng tiền</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: bold; color: #2ecc71;">${order.totalAmount.toLocaleString('vi-VN')} VNĐ</th>
                            </tr>
                        </tfoot>
                    </table>
                    <p style="line-height: 1.6; margin-top: 20px;">Nếu bạn có câu hỏi, vui lòng liên hệ <a href="mailto:${process.env.EMAIL_USER1}" style="color: #1a73e8; text-decoration: none;">${process.env.EMAIL_USER1}</a> hoặc <a href="tel:${process.env.PHONE_NUMBER}" style="color: #1a73e8; text-decoration: none;">${process.env.PHONE_NUMBER}</a>.</p>
                    <p style="line-height: 1.6;">Trân trọng,<br>Đội ngũ hỗ trợ</p>
                </div>
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

// Hàm gửi email thông báo cập nhật trạng thái đơn hàng
const sendOrderStatusUpdateEmail = async (orderId, newStatus, note = '') => {
    try {
        const order = await Order.findById(orderId).populate('items.variationId');
        if (!order) throw new Error('Đơn hàng không tồn tại');

        const email = order.shippingAddress.email;
        if (!isValidEmail(email)) {
            throw new Error(`Email khách hàng không hợp lệ: ${email}`);
        }

        // Tùy chỉnh thông điệp dựa trên trạng thái
        let statusMessage;
        switch (newStatus) {
            case 'pending':
                statusMessage = 'Đơn hàng của bạn đã được đặt và đang chờ xử lý.';
                break;
            case 'confirmed':
                statusMessage = 'Đơn hàng của bạn đã được xác nhận và đang được chuẩn bị.';
                break;
            case 'shipping':
                statusMessage = 'Đơn hàng của bạn đang được vận chuyển đến địa chỉ giao hàng.';
                break;
            case 'completed':
                statusMessage = 'Đơn hàng của bạn đã hoàn tất. Cảm ơn bạn đã mua sắm!';
                break;
            case 'canceled':
                statusMessage = `Đơn hàng của bạn đã bị hủy. ${note ? 'Lý do: ' + note : ''}`;
                break;
            default:
                statusMessage = `Đơn hàng của bạn đã được cập nhật trạng thái thành ${newStatus}.`;
        }

        // Tính tổng giá sản phẩm
        const totalItemsPrice = order.items.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);

        // Xử lý giá khuyến mãi
        let discountText = '';
        if (order.promotion && order.promotion.discountValue > 0) {
            if (order.promotion.discountType === 'percentage') {
                discountText = `Giảm ${order.promotion.discountValue}%${order.promotion.code ? ` (${order.promotion.code})` : ''}`;
            } else if (order.promotion.discountType === 'fixed') {
                discountText = `Giảm ${order.promotion.discountValue.toLocaleString('vi-VN')} VNĐ${order.promotion.code ? ` (${order.promotion.code})` : ''}`;
            }
        }

        const mailOptions = {
            from: process.env.EMAIL_USER1,
            to: email,
            subject: `Cập nhật trạng thái đơn hàng #${order.orderCode}`,
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: 'Roboto', Arial, sans-serif; color: #333;">
                    <h2 style="color: #1a73e8; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">Cập nhật trạng thái đơn hàng</h2>
                    <p style="line-height: 1.6; margin-bottom: 20px;">Chào ${order.shippingAddress.fullName},</p>
                    <p style="line-height: 1.6; margin-bottom: 20px;">${statusMessage}</p>
                    <h3 style="color: #1a73e8; margin-bottom: 15px;">Thông tin đơn hàng:</h3>
                    <ul style="list-style: none; padding-left: 0; margin-bottom: 20px;">
                        <li style="margin-bottom: 10px;"><strong>Mã đơn hàng:</strong> ${order.orderCode}</li>
                        <li style="margin-bottom: 10px;"><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'online_payment' ? 'Thanh toán trực tuyến' : order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}</li>
                        <li style="margin-bottom: 10px;"><strong>Trạng thái:</strong> ${newStatus}</li>
                        <li style="margin-bottom: 10px;"><strong>Địa chỉ giao hàng:</strong> ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}</li>
                        <li style="margin-bottom: 10px;"><strong>Địa chị nhận hàng:</strong>${order.shippingAddress.addressLine},</li>
                        <li style="margin-bottom: 10px;"><strong>Số điện thoại:</strong> ${order.shippingAddress.phone}</li>
                    </ul>
                    <h3 style="color: #1a73e8; margin-bottom: 15px;">Chi tiết sản phẩm:</h3>
                    <table style="width: 100%; max-width: 600px; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background-color: #f5f6fa;">
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: bold; color: #333;">Hình ảnh</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: bold; color: #333;">Tên sản phẩm</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: bold; color: #333;">Số lượng</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: bold; color: #333;">Đơn giá</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: bold; color: #333;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr>
                                    <td style="border: 1px solid #e0e0e0; padding: 12px;">
                                        <img src="cid:${item.variationId._id}" alt="${item.variationId.name}" style="width: 80px; height: auto; display: block;">
                                    </td>
                                    <td style="border: 1px solid #e0e0e0; padding: 12px;">${item.variationId.name}</td>
                                    <td style="border: 1px solid #e0e0e0; padding: 12px;">${item.quantity}</td>
                                    <td style="border: 1px solid #e0e0e0; padding: 12px;">${item.salePrice.toLocaleString('vi-VN')} VNĐ</td>
                                    <td style="border: 1px solid #e0e0e0; padding: 12px;">${(item.salePrice * item.quantity).toLocaleString('vi-VN')} VNĐ</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background-color: #f5f6fa;">
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: normal;" colspan="4">Tổng giá sản phẩm</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left;">${totalItemsPrice.toLocaleString('vi-VN')} VNĐ</th>
                            </tr>
                            <tr style="background-color: #f5f6fa;">
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: normal;" colspan="4">Phí vận chuyển</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left;">${(order.shippingFee || 0).toLocaleString('vi-VN')} VNĐ</th>
                            </tr>
                            ${discountText ? `
                            <tr style="background-color: #f5f6fa;">
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: normal;" colspan="4">Khuyến mãi</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left;">${discountText}</th>
                            </tr>
                            ` : ''}
                            <tr style="background-color: #f5f6fa;">
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: bold; color: #2ecc71;" colspan="4">Tổng tiền</th>
                                <th style="border: 1px solid #e0e0e0; padding: 12px; text-align: left; font-weight: bold; color: #2ecc71;">${order.totalAmount.toLocaleString('vi-VN')} VNĐ</th>
                            </tr>
                        </tfoot>
                    </table>
                    <p style="line-height: 1.6; margin-top: 20px;">Nếu bạn có câu hỏi, vui lòng liên hệ <a href="mailto:${process.env.EMAIL_USER1}" style="color: #1a73e8; text-decoration: none;">${process.env.EMAIL_USER1}</a> hoặc <a href="tel:${process.env.PHONE_NUMBER}" style="color: #1a73e8; text-decoration: none;">${process.env.PHONE_NUMBER}</a>.</p>
                    <p style="line-height: 1.6;">Trân trọng,<br>Đội ngũ hỗ trợ</p>
                </div>
            `,
            attachments: order.items.map(item => ({
                filename: item.variationId.name + '.jpg',
                path: path.join(__dirname, `../${item.variationId.colorImageUrl}`),
                cid: item.variationId._id.toString(),
            })),
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return { success: true, message: 'Email cập nhật trạng thái đã được gửi' };
    } catch (error) {
        console.error('Lỗi gửi email cập nhật trạng thái:', error);
        throw new Error('Gửi email thất bại: ' + error.message);
    }
};

// Hàm gửi email xác nhận giao hàng (giữ nguyên, nhưng có thể không cần nếu sendOrderStatusUpdateEmail đã bao quát)
// const sendOrderSuccessEmail = async (orderId) => {
//     try {
//         const order = await Order.findById(orderId).populate('items.variationId');
//         if (!order) throw new Error('Đơn hàng không tồn tại');
//         if (order.paymentMethod !== 'cod') throw new Error('Chỉ áp dụng cho đơn hàng COD');

//         const email = order.shippingAddress.email;
//         if (!isValidEmail(email)) {
//             throw new Error(`Email khách hàng không hợp lệ: ${email}`);
//         }

//         const mailOptions = {
//             from: process.env.EMAIL_USER1,
//             to: email,
//             subject: 'Xác nhận thanh toán thành công - Đơn hàng #' + order.orderCode,
//             html: `
//                 <h2 style="color: #2c3e50;">Cảm ơn bạn đã mua sắm!</h2>
//                 <p>Chào ${order.shippingAddress.fullName},</p>
//                 <p>Chúng tôi xin thông báo rằng thanh toán cho đơn hàng <strong>#${order.orderCode}</strong> đã được thực hiện thành công.</p>
//                 <p>Số điện thoại: ${order.shippingAddress.phone}</p>
//                 <p>Địa chỉ giao hàng: ${order.shippingAddress.addressLine}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}</p>
//                 <h3>Thông tin đơn hàng:</h3>
//                 <ul>
//                     <li><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'online_payment' ? 'Thanh toán trực tuyến' : order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}</li>
//                     <li><strong>Trạng thái:</strong> ${order.status}</li>
//                 </ul>
//                 <h3>Chi tiết sản phẩm:</h3>
//                 <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
//                     <thead>
//                         <tr style="background-color: #f2f2f2;">
//                             <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Hình ảnh</th>
//                             <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Tên sản phẩm</th>
//                             <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Số lượng</th>
//                             <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Đơn giá</th>
//                             <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Thành tiền</th>
//                         </tr>
//                     </thead>
//                     <tfoot>
//                         <tr style="background-color: #f2f2f2;">
//                             <th style="border: 1px solid #ddd; padding: 8px; text-align: left;" colspan="4">Tổng cộng</th>
//                             <th style="border: 1px solid #ddd; padding: 8px; text-align: left">${order.totalAmount.toLocaleString('vi-VN')} VNĐ</th>
//                         </tr>
//                     </tfoot>
//                     <tbody>
//                         ${order.items.map(item => `
//                             <tr>
//                                 <td style="border: 1px solid #ddd; padding: 8px;">
//                                     <img src="cid:${item.variationId._id}" alt="${item.variationId.name}" style="width: 100px; height: auto;">
//                                 </td>
//                                 <td style="border: 1px solid #ddd; padding: 8px;">${item.variationId.name}</td>
//                                 <td style="border: 1px solid #ddd; padding: 8px;">${item.quantity}</td>
//                                 <td style="border: 1px solid #ddd; padding: 8px;">${item.salePrice.toLocaleString('vi-VN')} VNĐ</td>
//                                 <td style="border: 1px solid #ddd; padding: 8px;">${(item.salePrice * item.quantity).toLocaleString('vi-VN')} VNĐ</td>
//                             </tr>
//                         `).join('')}
//                     </tbody>
//                 </table>
//                 <p>Nếu bạn có câu hỏi, vui lòng liên hệ <a href="mailto:${process.env.EMAIL_USER1}">${process.env.EMAIL_USER1}</a> hoặc <a href="tel:${process.env.PHONE_NUMBER}">${process.env.PHONE_NUMBER}</a>.</p>
//                 <p>Trân trọng,<br>Đội ngũ hỗ trợ</p>
//             `,
//             attachments: order.items.map(item => ({
//                 filename: item.variationId.name + '.jpg',
//                 path: path.join(__dirname, `../${item.variationId.colorImageUrl}`),
//                 cid: item.variationId._id.toString(),
//             })),
//         };

//         const info = await transporter.sendMail(mailOptions);
//         console.log('Email sent: %s', info.messageId);
//         return { success: true, message: 'Email xác nhận giao hàng đã được gửi' };
//     } catch (error) {
//         console.error('Lỗi gửi email:', error);
//         throw new Error('Gửi email thất bại: ' + error.message);
//     }
// };
module.exports = {
    sendPaymentSuccessEmail,
    sendOrderStatusUpdateEmail,
    // sendOrderSuccessEmail, // Giữ nguyên nếu cần sử dụng sau này
};