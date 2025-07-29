import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const ThankYouPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const orderId = (location.state as { orderId?: string })?.orderId;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <img src="https://cdn-icons-png.flaticon.com/512/845/845646.png" alt="Success" className="mx-auto mb-6 w-24 h-24" />
        <h1 className="text-3xl font-bold text-green-600 mb-2">Cảm ơn bạn đã đặt hàng!</h1>
        <p className="text-gray-700 mb-4">
          Đơn hàng của bạn đã được tiếp nhận. Chúng tôi sẽ liên hệ và giao hàng trong thời gian sớm nhất.
        </p>

        {orderId && (
          <p className="text-sm text-gray-500 mb-6">
            Mã đơn hàng của bạn: <span className="font-semibold">{orderId}</span>
          </p>
        )}

        <div className="space-x-4">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={() => { navigate('/'); window.location.reload(); }}
          >
            Quay về trang chủ
          </button>
          <button
            className="px-4 py-2 border border-gray-400 rounded hover:bg-gray-100 transition"
            onClick={() => navigate('/order-history')}
          >
            Xem đơn hàng
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ThankYouPage;