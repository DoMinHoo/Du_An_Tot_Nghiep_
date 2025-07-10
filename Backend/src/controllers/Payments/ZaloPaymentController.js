// const axios = require('axios');
// const CryptoJS = require('crypto-js');
// const moment = require('moment');
// const Order = require('../../models/order.model');

// // APP INFO
// const config = {
//     app_id: "2553",
//     key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
//     key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
//     endpoint: "https://sb-openapi.zalopay.vn/v2/create"
// };

// // Xử lý yêu cầu thanh toán
// // Xử lý yêu cầu thanh toán
// async function initiatePayment(req, res) {
//     const { orderCode } = req.body;

//     try {
//         // Lấy đơn hàng từ DB theo orderCode
//         const order = await Order.findOne({ orderCode }).populate('items.variationId');

//         if (!order) {
//             return res.status(404).json({ message: 'Order not found' });
//         }

//         if (order.paymentMethod !== 'online_payment') {
//             return res.status(400).json({ message: 'Invalid payment method' });
//         }

//         // Tạo transaction ID (Sử dụng ngày + số ngẫu nhiên)
//         const transID = Math.floor(Math.random() * 1000000);

//         // Danh sách sản phẩm
//         const items = order.items.map(item => ({
//             name: item.variationId.name,
//             quantity: item.quantity,
//             price: item.salePrice
//         }));

//         const embed_data = {
//             preferred_payment_method: ["international_card"],
//             redirecturl: "http://localhost:5173/check-payment"
//         };

//         // Tạo dữ liệu gửi đến ZaloPay API
//         const orderData = {
//             app_id: config.app_id,
//             app_trans_id: `${moment().format('YYMMDD')}_${transID}`,  // Mã đơn hàng
//             app_user: order.userId.toString(),
//             app_time: Date.now(),
//             item: JSON.stringify(items),
//             embed_data: JSON.stringify(embed_data),
//             amount: order.totalAmount,
//             description: `Payment for order #${orderCode}`,
//             bank_code: "",  // Mã ngân hàng (nếu cần)
//             notify_url: "https://a903-58-187-16-140.ngrok-free.app/api/zalo-payment/notify",// URL thông báo kết quả thanh toán
//         };

//         console.log("Created app_trans_id:", orderData.app_trans_id);
//         // Tạo chuỗi dữ liệu để tính toán chữ ký (MAC)
//         const data = `${orderData.app_id}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.embed_data}|${orderData.item}`;
//         console.log("Data for HMAC:", data);
//         orderData.mac = CryptoJS.HmacSHA256(data, config.key1).toString();  // Tạo chữ ký HMAC SHA256

//         // Gửi yêu cầu tới ZaloPay API v2
//         const response = await axios.post(config.endpoint, null, { params: orderData });


//         // In ra phản hồi từ ZaloPay để kiểm tra chi tiết lỗi
//         console.log("ZaloPay Response:", response.data);





//         // Nếu thanh toán thành công
//         order.paymentTransactionId = response.data.transid;
//         order.paymentStatus = 'pending';  // Đặt trạng thái thanh toán là đang chờ
//         order.status = 'pending';  // Đơn hàng đang chờ thanh toán
//         order.paymentData = response.data;  // Lưu dữ liệu trả về từ ZaloPay (nếu cần)
//         order.app_trans_id = orderData.app_trans_id;
//         await order.save();

//         return res.status(200).json({
//             message: 'Payment initiated successfully',
//             ...response.data,
//         });
//     } catch (error) {
//         console.error('Error during payment initiation:', error);
//         return res.status(500).json({ message: 'Payment initiation failed', error: error.message });
//     }
// }


// // Xử lý callback thanh toán từ ZaloPay
// async function handlePaymentCallback(req, res) {
//     const { data, mac } = req.body;

//     const hmac = CryptoJS.HmacSHA256(data, config.key2).toString();
//     if (mac !== hmac) {
//         console.error("Invalid MAC signature.");
//         return res.status(400).send("Invalid MAC");
//     }

//     const decodedData = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
//     console.log("ZaloPay callback data:", decodedData);

//     const { app_trans_id, zp_trans_id, return_code } = decodedData;

//     try {
//         // ✅ Tìm theo app_trans_id
//         const order = await Order.findOne({ app_trans_id });

//         if (!order) {
//             console.error("Order not found for app_trans_id:", app_trans_id);
//             return res.status(404).send("Order not found");
//         }

//         if (return_code === 1) {
//             order.paymentStatus = "completed";
//             order.status = "confirmed";
//         } else {
//             order.paymentStatus = "failed";
//             order.status = "canceled";
//         }

//         order.paymentTransactionId = zp_trans_id;
//         order.paymentData = decodedData;

//         await order.save();

//         res.status(200).send("OK");
//     } catch (err) {
//         console.error("Error processing callback:", err);
//         res.status(500).send("Server error");
//     }
// }
// async function handleReturnFromZalo(req, res) {
//     const { apptransid, status } = req.body;

//     if (!apptransid) {
//         return res.status(400).json({ success: false, message: "Missing apptransid" });
//     }

//     try {
//         const order = await Order.findOne({ app_trans_id: apptransid });

//         if (!order) {
//             return res.status(404).json({ success: false, message: "Order not found" });
//         }

//         if (status === "1") {
//             order.paymentStatus = "completed";
//             order.status = "shipping";
//         } else {
//             order.paymentStatus = "failed";
//             order.status = "canceled";
//         }

//         await order.save();

//         return res.json({ success: true });
//     } catch (err) {
//         console.error("Error handling return:", err);
//         return res.status(500).json({ success: false, message: "Server error" });
//     }
// }



// module.exports = { initiatePayment, handlePaymentCallback, handleReturnFromZalo };
const axios = require('axios');
const CryptoJS = require('crypto-js');
const moment = require('moment');
const Order = require('../../models/order.model');
const {sendPaymentSuccessEmail} = require('../../untils/sendPaymentSuccessEmail');

const config = {
    app_id: "2553",
    key1: "PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL",
    key2: "kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz",
    endpoint: "https://sb-openapi.zalopay.vn/v2/create",
};

async function initiatePayment(req, res) { // Xử lý yêu cầu thanh toán
    const { orderCode } = req.body;

    try {
        const order = await Order.findOne({ orderCode }).populate('items.variationId');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        if (order.paymentMethod !== 'online_payment') return res.status(400).json({ message: 'Invalid payment method' });

        const transID = Math.floor(Math.random() * 1000000);
        const items = order.items.map(item => ({
            name: item.variationId.name,
            quantity: item.quantity,
            price: item.salePrice,
        }));

        const embed_data = {
            preferred_payment_method: ["international_card"],
            redirecturl: "http://localhost:5173/check-payment",
        };

        const orderData = {
            app_id: config.app_id,
            app_trans_id: `${moment().format('YYMMDD')}_${transID}`,
            app_user: order.userId.toString(),
            app_time: Date.now(),
            item: JSON.stringify(items),
            embed_data: JSON.stringify(embed_data),
            amount: order.totalAmount,
            description: `Payment for order #${orderCode}`,
            bank_code: "",
            notify_url: "https://a903-58-187-16-140.ngrok-free.app/api/zalo-payment/notify",
        };

        const data = `${orderData.app_id}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.embed_data}|${orderData.item}`;
        orderData.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

        const response = await axios.post(config.endpoint, null, { params: orderData });
        console.log("ZaloPay Response:", response.data);

        order.paymentTransactionId = response.data.transid;
        order.paymentStatus = 'pending';
        order.status = 'pending';
        order.app_trans_id = orderData.app_trans_id;
        await order.save();

        res.status(200).json({ message: 'Payment initiated successfully', ...response.data });
    } catch (error) {
        console.error('Error during payment initiation:', error);
        res.status(500).json({ message: 'Payment initiation failed', error: error.message });
    }
}

async function handlePaymentCallback(req, res) { // Xử lý callback thanh toán từ ZaloPay
    const { data, mac } = req.body;
    const hmac = CryptoJS.HmacSHA256(data, config.key2).toString();
    if (mac !== hmac) return res.status(400).send("Invalid MAC");

    const decodedData = JSON.parse(Buffer.from(data, "base64").toString("utf8"));
    console.log("ZaloPay callback data:", decodedData);

    const { app_trans_id, zp_trans_id, return_code } = decodedData;

    try {
        const order = await Order.findOne({ app_trans_id });
        if (!order) return res.status(404).send("Order not found");

        if (return_code === 1) {
            order.paymentStatus = "completed";
            order.status = "confirmed";
        } else {
            order.paymentStatus = "failed";
            order.status = "canceled";
        }

        order.paymentTransactionId = zp_trans_id;
        order.paymentData = decodedData;
        await order.save();
        // Gửi email xác nhận
        const emailResult = await sendPaymentSuccessEmail(order._id);
        if (!emailResult.success) {
            console.error('Failed to send payment success email:', emailResult.message);
        }
        res.status(200).send("OK");
    } catch (err) {
        console.error("Error processing callback:", err);
        res.status(500).send("Server error");
    }
}

async function handleReturnFromZalo(req, res) { // Xử lý trả về từ ZaloPay
    const { apptransid, status } = req.body;
    if (!apptransid) return res.status(400).json({ success: false, message: "Missing apptransid" });

    try {
        const order = await Order.findOne({ app_trans_id: apptransid });
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        if (status === "1") {
            order.paymentStatus = "completed";
            order.status = "shipping";
            await order.save();
                const emailResult = await sendPaymentSuccessEmail(order._id);
                if (!emailResult.success) {
                    console.error('Failed to send payment success email:', emailResult.message);
                }
        } else {
            order.paymentStatus = "failed";
            order.status = "canceled";
        }

        await order.save();
        res.json({ success: true });
    } catch (err) {
        console.error("Error handling return:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

module.exports = { initiatePayment, handlePaymentCallback, handleReturnFromZalo };