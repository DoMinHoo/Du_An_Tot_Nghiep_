import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../constants/api";

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
}

interface Order {
  _id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: string;
  createdAt: string;
}

const CartPage: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const userId = localStorage.getItem("userId") || ""; // Bạn có thể thay thế cách lấy userId

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/orders/user/${userId}`);
        const latestOrder: Order = res.data[0];
        if (latestOrder && latestOrder.items?.length) {
          setCartItems(latestOrder.items);
        }
      } catch (err) {
        console.error("Không thể tải giỏ hàng:", err);
      }
    };

    fetchCartItems();
  }, [userId]);

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    setCartItems((prev) => prev.filter((item) => !selectedItems.includes(item.id)));
    setSelectedItems([]);
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

  const handleChangeQuantity = (id: string, type: "inc" | "dec") => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = type === "inc" ? item.quantity + 1 : Math.max(item.quantity - 1, 1);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleDeleteOne = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
  };

  const total = cartItems
    .filter((item) => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.quantity * item.price, 0);

  const handleCheckout = async () => {
    try {
      const selectedProducts = cartItems.filter((item) =>
        selectedItems.includes(item.id)
      );

      const payload = {
        userId,
        items: selectedProducts,
        note,
        total,
      };

      await axios.post(`${API_BASE_URL}/orders`, payload);
      alert("Đặt hàng thành công!");
      setSelectedItems([]);
    } catch (err) {
      console.error("Lỗi khi thanh toán:", err);
      alert("Đã xảy ra lỗi khi thanh toán.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-center mb-8 relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-12 after:bg-black">
        Giỏ hàng của bạn
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded">
            <span>Có {cartItems.length} sản phẩm trong giỏ hàng</span>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedItems.length === 0}
              className="text-red-600 font-semibold hover:underline disabled:opacity-40"
            >
              Xóa đã chọn
            </button>
          </div>

          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-4 bg-white rounded-xl shadow p-4"
            >
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => toggleSelectItem(item.id)}
                className="mt-2 accent-black w-5 h-5"
              />
              <img
                src={item.image}
                alt="Product"
                className="w-28 h-28 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                <div className="text-red-600 font-semibold mt-1">
                  {formatCurrency(item.price)}
                </div>
                {item.originalPrice && (
                  <div className="line-through text-sm text-gray-400">
                    {formatCurrency(item.originalPrice)}
                  </div>
                )}
                <div className="flex items-center mt-3 w-max border rounded overflow-hidden">
                  <button
                    onClick={() => handleChangeQuantity(item.id, "dec")}
                    className="px-3 py-1 text-lg bg-gray-100 hover:bg-gray-200"
                  >
                    −
                  </button>
                  <input
                    type="text"
                    readOnly
                    value={item.quantity}
                    className="w-12 text-center border-x outline-none text-base py-1"
                  />
                  <button
                    onClick={() => handleChangeQuantity(item.id, "inc")}
                    className="px-3 py-1 text-lg bg-gray-100 hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="text-right">
                <button
                  onClick={() => handleDeleteOne(item.id)}
                  className="text-xl text-gray-500 hover:text-black"
                >
                  ×
                </button>
                <div className="font-bold mt-4">
                  {formatCurrency(item.price * item.quantity)}
                </div>
              </div>
            </div>
          ))}

          <div>
            <label className="block font-semibold mb-2">Ghi chú đơn hàng</label>
            <textarea
              placeholder="Nhập ghi chú..."
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 sticky top-8">
          <h3 className="text-lg font-semibold border-b pb-2 mb-4">
            Thông tin đơn hàng
          </h3>
          <div className="flex justify-between text-lg font-bold text-red-600 mb-4">
            <span>Tổng tiền:</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <button
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
            disabled={selectedItems.length === 0}
            onClick={handleCheckout}
          >
            THANH TOÁN
          </button>

          <div className="text-sm text-gray-600 mt-6 space-y-3">
            <div>
              <span className="inline-block text-lg mr-2">🛡️</span>
              Không rủi ro. Đặt hàng trước, thanh toán sau tại nhà.
            </div>
            <div>
              <span className="inline-block text-lg mr-2">⏱️</span>
              Giao hàng trong vòng 3 ngày sau xác nhận.
            </div>
            <div>
              <span className="inline-block text-lg mr-2">🏆</span>
              Chất lượng Quốc Tế đảm bảo tiêu chuẩn.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
