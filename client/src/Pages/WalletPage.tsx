import React, { useEffect, useState } from "react";
import axios from "axios";

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

  const token = sessionStorage.getItem("token");
  const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");

  useEffect(() => {
    if (!currentUser?._id) {
      console.error("❌ Không tìm thấy user đăng nhập");
      setLoading(false);
      return;
    }

    axios
      .get(`http://localhost:5000/api/orders/wallet/${currentUser._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("✅ Wallet data:", res.data);
        setBalance(res.data.balance || 0);
        setTransactions(res.data.transactions || []);
      })
      .catch((err) => {
        console.error("❌ API ví lỗi:", err.response?.data || err.message);
      })
      .finally(() => setLoading(false));
  }, [currentUser?._id, token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">💰 Ví của tôi</h2>

      {/* Số dư */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 rounded-2xl shadow-lg text-center text-white mb-10">
        <p className="text-lg">Số dư hiện tại</p>
        <p className="text-5xl font-extrabold mt-3">
          {balance.toLocaleString()}₫
        </p>
      </div>

      {/* Lịch sử giao dịch */}
      <h3 className="text-2xl font-semibold mb-5 text-gray-700">
        📜 Lịch sử giao dịch
      </h3>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {transactions.length === 0 ? (
          <p className="p-6 text-gray-500 text-center">
            Chưa có giao dịch nào.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {transactions.map((t, idx) => (
              <li
                key={idx}
                className="p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:bg-gray-50 transition"
              >
                {/* Left side */}
                <div>
                  <p className="font-medium text-gray-800">
                    {t.type === "refund"
                      ? "Hoàn tiền đơn hàng"
                      : t.type === "payment"
                      ? "Thanh toán đơn hàng"
                      : "Khác"}
                  </p>
                  {t.orderId && (
                    <p className="text-sm text-gray-500 mt-1">
                      Mã đơn:{" "}
                      <span className="font-medium text-gray-700">
                        {t.orderId.orderCode}
                      </span>
                    </p>
                  )}
                </div>

                {/* Right side */}
                <div className="text-right mt-3 sm:mt-0">
                  <p
                    className={`text-lg font-semibold ${
                      t.amount > 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {t.amount > 0 ? "+" : ""}
                    {t.amount.toLocaleString()}₫
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(t.date).toLocaleString("vi-VN")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
