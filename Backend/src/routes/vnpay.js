const express = require('express');
const moment = require('moment');
const querystring = require('qs');
const crypto = require('crypto');
const OrderModel = require('../models/order.model'); // Import schema OrderModel

const router = express.Router();

// Tạo URL thanh toán VNPay
router.post('/create-payment', async (req, res) => {
  const tmnCode = process.env.VNP_TMNCODE || 'WT03AIJT';
  const secretKey = process.env.VNP_HASH_SECRET || 'ZXUDCD0YK2YBN0AQH8RV7YMAZ0IU31VR';
  const vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:5000/api/vnpay/return-vnpay';

  if (!tmnCode || !secretKey || !returnUrl) {
    console.error('Missing environment variables:', { tmnCode, secretKey, returnUrl });
    return res.status(400).json({ error: 'Missing required environment variables' });
  }

  const { amount, orderCode } = req.body; // Nhận orderCode từ frontend

  if (isNaN(amount) || amount <= 0) {
    console.error('Invalid amount:', amount);
    return res.status(400).json({ error: 'Invalid or missing amount' });
  }

  if (!orderCode) {
    console.error('Missing orderCode');
    return res.status(400).json({ error: 'Missing orderCode' });
  }

  // Kiểm tra xem đơn hàng có tồn tại không
  const order = await OrderModel.findOne({ orderCode });
  if (!order) {
    console.error('Order not found:', orderCode);
    return res.status(404).json({ error: 'Order not found' });
  }

  const ipAddr = req.ip === '::1' ? '127.0.0.1' : req.ip || '127.0.0.1';
  const bankCode = req.body.bankCode || '';

  const date = moment();
  const createDate = date.format('YYYYMMDDHHmmss');
  const vnpAmount = Math.round(amount * 100);

  const orderInfo = `Thanh_toan_don_hang_${orderCode}`;
  const orderType = 'other';
  const locale = 'vn';
  const currCode = 'VND';

  let vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: currCode,
    vnp_TxnRef: orderCode, // Sử dụng orderCode làm vnp_TxnRef
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: orderType,
    vnp_Amount: vnpAmount,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  if (bankCode) {
    vnp_Params['vnp_BankCode'] = bankCode;
  }

  vnp_Params = sortObject(vnp_Params);

  const signData = querystring.stringify(vnp_Params, { encode: true });
  console.log('signData:', signData);

  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  vnp_Params['vnp_SecureHash'] = signed;

  const paymentUrl = `${vnpUrl}?${querystring.stringify(vnp_Params, { encode: true })}`;
  console.log('paymentUrl:', paymentUrl);

  res.json({ paymentUrl });
});

// Xử lý redirect từ VNPay
router.get('/return-vnpay', async (req, res) => {
  let vnp_Params = { ...req.query };
  const secureHash = vnp_Params['vnp_SecureHash'];
  const secretKey = process.env.VNP_HASH_SECRET;

  if (!secretKey) {
    return res.status(500).json({ error: 'VNP_HASH_SECRET not configured in .env' });
  }

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  const sortedParams = sortObject(vnp_Params);
  const signData = querystring.stringify(sortedParams, { encode: false });

  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  if (secureHash !== signed) {
    console.error('Invalid secure hash:', { secureHash, signed });
    return res.redirect(
      `http://localhost:5173/vnpay/result?status=failed&message=Invalid secure hash`
    );
  }

  const {
    vnp_ResponseCode,
    vnp_TransactionNo,
    vnp_Amount,
    vnp_OrderInfo,
    vnp_TxnRef,
    vnp_BankCode,
    vnp_PayDate,
  } = vnp_Params;

  const amount = parseInt(vnp_Amount || '0') / 100;

  let paymentTime = '';
  if (vnp_PayDate && vnp_PayDate.length === 14) {
    const year = vnp_PayDate.slice(0, 4);
    const month = vnp_PayDate.slice(4, 6);
    const day = vnp_PayDate.slice(6, 8);
    const hour = vnp_PayDate.slice(8, 10);
    const minute = vnp_PayDate.slice(10, 12);
    const second = vnp_PayDate.slice(12, 14);
    paymentTime = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`).toISOString();
  }

  // Cập nhật trạng thái đơn hàng trong database
  if (vnp_ResponseCode === '00') {
    try {
      const updatedOrder = await OrderModel.findOneAndUpdate(
        { orderCode: vnp_TxnRef },
        {
          $set: {
            paymentStatus: 'completed',
            paymentTransactionId: vnp_TransactionNo,
            paymentTime: paymentTime,
            bankCode: vnp_BankCode,
            amount: amount,
            statusHistory: [
              ...(await OrderModel.findOne({ orderCode: vnp_TxnRef }).then((order) => order?.statusHistory || [])),
              {
                status: 'confirmed',
                changedAt: new Date(),
                note: 'Payment confirmed via VNPay',
              },
            ],
          },
        },
        { new: true }
      );
      if (!updatedOrder) {
        console.error('Order not found for update:', vnp_TxnRef);
        return res.redirect(
          `http://localhost:5173/vnpay/result?status=failed&message=Order not found`
        );
      }
      console.log('Order updated:', updatedOrder);
    } catch (error) {
      console.error('Error updating order:', error);
      return res.redirect(
        `http://localhost:5173/vnpay/result?status=failed&message=Error updating order`
      );
    }
  } else {
    // Cập nhật trạng thái thất bại nếu cần
    try {
      await OrderModel.findOneAndUpdate(
        { orderCode: vnp_TxnRef },
        {
          $set: {
            paymentStatus: 'failed',
            paymentTransactionId: vnp_TransactionNo,
            paymentTime: paymentTime,
            bankCode: vnp_BankCode,
            amount: amount,
            statusHistory: [
              ...(await OrderModel.findOne({ orderCode: vnp_TxnRef }).then((order) => order?.statusHistory || [])),
              {
                status: 'failed',
                changedAt: new Date(),
                note: `Payment failed: ${vnp_ResponseCode}`,
              },
            ],
          },
        },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating order status to failed:', error);
    }
  }

  const queryString = new URLSearchParams({
    status: vnp_ResponseCode === '00' ? 'success' : 'failed',
    message: vnp_ResponseCode === '00' ? 'Transaction successful' : 'Transaction failed',
    txnRef: vnp_TxnRef,
    transactionNo: vnp_TransactionNo,
    amount: amount.toString(),
    orderInfo: vnp_OrderInfo,
    bankCode: vnp_BankCode || '',
    paymentTime,
    responseCode: vnp_ResponseCode,
  }).toString();

  const frontendUrl = `http://localhost:5173/vnpay/result?${queryString}`;
  return res.redirect(frontendUrl);
});

// Endpoint để lấy thông tin đơn hàng
router.get('/orders/:orderCode', async (req, res) => {
  try {
    const order = await OrderModel.findOne({ orderCode: req.params.orderCode })
      .populate('items.variationId')
      .lean();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Endpoint để lấy danh sách đơn hàng (tùy chọn, dùng cho OrderHistoryPage)
router.get('/orders', async (req, res) => {
  try {
    const { guestId } = req.query;
    const token = req.headers.authorization?.split(' ')[1];
    let query = {};
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      query = { userId: payload.id };
    } else if (guestId) {
      query = { guestId };
    }
    const orders = await OrderModel.find(query).populate('items.variationId').lean();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
}

module.exports = router;