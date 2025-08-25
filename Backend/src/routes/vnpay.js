const express = require('express');
const moment = require('moment');
const querystring = require('qs');
const crypto = require('crypto');

const router = express.Router();

router.post('/create-payment', (req, res) => {
  const tmnCode = process.env.VNP_TMNCODE || 'WT03AIJT';
  const secretKey = process.env.VNP_HASH_SECRET || 'ZXUDCD0YK2YBN0AQH8RV7YMAZ0IU31VR';
  const vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:5000/api/vnpay/return-vnpay';

  if (!tmnCode || !secretKey || !returnUrl) {
    console.error('Missing environment variables:', { tmnCode, secretKey, returnUrl });
    return res.status(400).json({ error: 'Missing required environment variables (VNP_TMNCODE, VNP_HASH_SECRET, or VNP_RETURN_URL)' });
  }

  const amount = parseFloat(req.body.amount);
  if (isNaN(amount) || amount <= 0) {
    console.error('Invalid amount:', req.body.amount);
    return res.status(400).json({ error: 'Invalid or missing amount' });
  }

  const ipAddr = req.ip === '::1' ? '127.0.0.1' : req.ip || '127.0.0.1';
  const bankCode = req.body.bankCode || '';

  const date = moment();
  const createDate = date.format('YYYYMMDDHHmmss');
  const orderId = date.format('HHmmss');
  const vnpAmount = Math.round(amount * 100); 

  const orderInfo = 'Thanh_toan_don_hang'; 
  const orderType = 'other';
  const locale = 'vn';
  const currCode = 'VND';

  let vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: currCode,
    vnp_TxnRef: orderId,
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
  console.log('signed:', signed); 

  vnp_Params['vnp_SecureHash'] = signed;

  // Tạo URL thanh toán
  const paymentUrl = `${vnpUrl}?${querystring.stringify(vnp_Params, { encode: true })}`;
  console.log('paymentUrl:', paymentUrl);

  res.json({ paymentUrl });
});

router.get('/return-vnpay', async (req, res) => {
  let vnp_Params = { ...req.query };
  const secureHash = vnp_Params['vnp_SecureHash'];
  const secretKey = process.env.VNP_HASH_SECRET;

  if (!secretKey) {
    return res.status(500).json({ error: 'VNP_HASH_SECRET not configured in .env' });
  }

  // Bỏ các thông tin không cần khi hash
  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  // Sắp xếp và tạo chuỗi dữ liệu
  const sortedParams = sortObject(vnp_Params);
  const signData = querystring.stringify(sortedParams, { encode: false });

  // Tạo chữ ký từ server
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  if (secureHash !== signed) {
    return res.redirect(
      `http://localhost:5173/vnpay/result?status=failed&message=Invalid secure hash`
    );
  }

  // Trích xuất dữ liệu từ VNPAY
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

  // Chuyển đổi định dạng thời gian VNPAY → ISO (YYYY-MM-DDTHH:mm:ss)
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

  // Chuẩn bị redirect FE kèm theo dữ liệu
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