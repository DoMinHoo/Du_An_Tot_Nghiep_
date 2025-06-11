const express = require('express');
const router = express.Router();
const { createPayment, getPayments, getPaymentById, updatePayment } = require('../controllers/payment.controller');

// Tạo mới thanh toán
router.post('/', createPayment);

// Lấy danh sách thanh toán
router.get('/', getPayments);

// Lấy thanh toán theo ID
router.get('/:id', getPaymentById);

router.put('/:id', updatePayment);

module.exports = router;
