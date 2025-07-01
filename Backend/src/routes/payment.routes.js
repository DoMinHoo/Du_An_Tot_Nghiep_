const express = require('express');
const paymentController = require('../controllers/Payments/ZaloPaymentController');
const router = express.Router();

// Route để tạo thanh toán ZaloPay
router.post('/create-payment', paymentController.initiatePayment);

router.post('/notify', paymentController.handlePaymentCallback);

router.post("/return", paymentController.handleReturnFromZalo);

// router.post("/api/zalo-payment/notify", (req, res) => {
//     console.log("Received callback:", req.body);
//     res.send("OK");
// });

module.exports = router;