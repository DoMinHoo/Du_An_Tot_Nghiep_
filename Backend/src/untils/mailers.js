const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Tạo transporter cho Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail', // Sử dụng dịch vụ Gmail
    auth: {
        user: process.env.EMAIL_USER,  // Email của bạn
        pass: process.env.EMAIL_PASS,  // App Password (mã 16 ký tự bạn đã tạo)
    },
});

// Hàm gửi email
const sendEmail = async (to, subject, text) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER, // Email người gửi
            to: to,                       // Email người nhận
            subject: subject,             // Tiêu đề email
            text: text,                   // Nội dung email
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Có lỗi xảy ra khi gửi email');
    }
};

module.exports = { sendEmail };
