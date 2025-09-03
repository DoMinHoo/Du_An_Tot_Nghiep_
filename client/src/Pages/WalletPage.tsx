import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Transaction {
  type: string;
  amount: number;
  orderId?: { _id: string; orderCode: string; totalAmount: number };
  date: string;
}

const WalletPage: React.FC = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const token = sessionStorage.getItem('token');
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

  useEffect(() => {
    if (!currentUser?._id) {
      console.error('❌ Không tìm thấy user đăng nhập');
      setLoading(false);
      return;
    }

    axios
      .get(`http://localhost:5000/api/orders/wallet/${currentUser._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log('✅ Wallet data:', res.data);
        setBalance(res.data.balance || 0);
        // Sắp xếp giảm dần theo ngày để giao dịch mới nhất lên đầu
        const sortedTransactions = (res.data.transactions || []).sort(
          (a: Transaction, b: Transaction) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setTransactions(sortedTransactions);
      })
      .catch((err) => {
        console.error('❌ API ví lỗi:', err.response?.data || err.message);
      })
      .finally(() => setLoading(false));
  }, [currentUser?._id, token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Ví của tôi</h2>

      {/* Số dư */}
      <div className="bg-white p-6 rounded shadow mb-6 text-center">
        <p className="text-lg text-gray-600">Số dư hiện tại</p>
        <p className="text-4xl font-bold text-green-600 mt-2">
          {balance.toLocaleString()} VND
        </p>
      </div>

      {/* Lịch sử giao dịch */}
      <h3 className="text-xl font-semibold mb-4">Lịch sử giao dịch</h3>
      <div className="bg-white rounded shadow divide-y">
        {transactions.length === 0 ? (
          <p className="p-4 text-gray-500">Chưa có giao dịch nào.</p>
        ) : (
          transactions.map((t, idx) => (
            <div
              key={idx}
              className="p-4 flex flex-col md:flex-row md:justify-between md:items-center"
            >
              <div>
                <p className="font-medium">
                  {t.type === 'refund'
                    ? 'Hoàn tiền đơn hàng'
                    : t.type === 'payment'
                    ? 'Thanh toán'
                    : 'Khác'}
                </p>
                {t.orderId && (
                  <p className="text-sm text-gray-500">
                    Mã đơn: {t.orderId.orderCode}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p
                  className={`font-semibold ${
                    t.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {t.amount > 0 ? '+' : ''}
                  {t.amount.toLocaleString()} VND
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(t.date).toLocaleString('vi-VN')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WalletPage;
