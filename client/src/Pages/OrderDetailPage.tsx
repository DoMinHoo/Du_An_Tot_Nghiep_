import type React from "react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getImageUrl } from "../utils/imageUtils";

const statusText: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao hàng",
  completed: "Đã giao hàng",
  canceled: "Đã hủy đơn",
};

const paymentStatusText: Record<string, string> = {
  pending: "Chưa thanh toán",
  completed: "Đã thanh toán",
  failed: "Thanh toán thất bại",
  refunded: "Đã hoàn tiền",
  expired: "Thanh toán hết hạn",
};

const OrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem("token");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrder(res.data.data);
      } catch (err) {
        navigate("/order-history");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id, token, navigate]);

  const calculateSubtotal = () => {
    return order?.items?.reduce(
      (total: number, item: any) =>
        total + (item.salePrice || 0) * (item.quantity || 0),
      0
    ) || 0;
  };

  // const getDiscountAmount = () => {
  //   if (!order?.promotion) return 0;
  //   const subtotal = calculateSubtotal();
  //   if (order.promotion.discountType === "percentage") {
  //     return Math.floor((subtotal * order.promotion.discountValue) / 100);
  //   }
  //   return order.promotion.discountValue || 0;
  // };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <p className="text-center text-red-600 mt-10">Không tìm thấy đơn hàng</p>
    );
  }

const subtotal = calculateSubtotal();
// ✅ discountAmount lấy từ backend qua chênh lệch subtotal + phí ship - totalAmount
const discountAmount =
  subtotal + (order.shippingFee || 0) - (order.totalAmount || 0);


  return (
  <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
    <h1 className="text-3xl font-bold mb-8 text-gray-900">Chi tiết đơn hàng</h1>

    {/* Thông tin chung */}
    <div className="grid md:grid-cols-2 gap-6 bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="space-y-1">
        <p className="font-semibold text-gray-800"><strong>Mã đơn:</strong> {order.orderCode}</p>
        <p className="text-gray-600"><strong>Ngày đặt:</strong> {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
        <p className="font-semibold text-gray-800"><strong>Trạng thái đơn:</strong> {statusText[order.status]}</p>
      </div>
      <div className="space-y-1">
        <p className="font-semibold text-gray-800"><strong>Thanh toán:</strong> {paymentStatusText[order.paymentStatus]}</p>
        <p className="font-semibold text-gray-800">
          <strong>Phương thức:</strong>{" "}
          {order.paymentMethod === "cod"
            ? "Thanh toán khi nhận hàng"
            : order.paymentMethod === "online_payment"
            ? "Thanh toán qua ZaloPay"
            : order.paymentMethod === "wallet"
            ? "Thanh toán bằng Ví"
            : "Không xác định"}
        </p>
      </div>
    </div>

    {/* Thông tin người nhận */}
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Thông tin người nhận</h2>
      <div className="grid md:grid-cols-2 gap-4 text-gray-700 text-sm">
        <div className="space-y-1">
          <p><strong>Họ tên:</strong> {order.shippingAddress.fullName}</p>
          <p><strong>SĐT:</strong> {order.shippingAddress.phone}</p>
          <p><strong>Email:</strong> {order.shippingAddress.email}</p>
        </div>
        <div className="space-y-1">
          <p><strong>Địa chỉ:</strong> {`${order.shippingAddress.addressLine}, ${order.shippingAddress.street}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}`}</p>
        </div>
      </div>
    </div>

    {/* Danh sách sản phẩm */}
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Sản phẩm</h2>
      <div className="space-y-4">
        {order.items.map((item: any, idx: number) => (
          <div
            key={idx}
            className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white rounded-2xl shadow hover:shadow-lg transition-shadow"
          >
            {/* Ảnh sản phẩm */}
            <img
              src={getImageUrl(item.colorImageUrl || item.image) || "/placeholder.svg"}
              alt={item.name}
              className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl shadow-sm"
              onError={(e) => {(e.target as HTMLImageElement).src = "/default-product.jpg";}}
            />

            {/* Thông tin sản phẩm */}
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-gray-900 text-lg">{item.name}</p>
              <p className="text-gray-600 text-sm">Màu: {item.colorName}</p>
              {item.dimensions && <p className="text-gray-600 text-sm">Kích thước: {item.dimensions}</p>}
              {item.material && <p className="text-gray-600 text-sm">Chất liệu: {item.material}</p>}
              {item.sku && <p className="text-gray-400 text-xs">SKU: {item.sku}</p>}
            </div>

            {/* Giá sản phẩm */}
            <div className="text-right min-w-[130px]">
              <p className="text-gray-700 text-sm">{(item.salePrice || 0).toLocaleString()} VND x {item.quantity}</p>
              <p className="font-bold text-red-600 text-lg">{(item.subtotal || 0).toLocaleString()} VND</p>
            </div>
          </div>
        ))}
      </div>
    </div>


    {/* Tổng tiền */}
    <div className="bg-white rounded-xl shadow-md p-6 text-right space-y-2 text-gray-800 font-medium">
      <p><strong>Tổng tiền hàng:</strong> {subtotal.toLocaleString()} VND</p>
      <p>
        <strong>Mã giảm giá:</strong>{" "}
        {order.promotion?.code
          ? `${order.promotion.code} (${order.promotion.discountType === "percentage" ? `${order.promotion.discountValue}%` : `${order.promotion.discountValue.toLocaleString()}₫`})`
          : "Không áp dụng"}
      </p>
      <p><strong>Giảm giá:</strong> -{Math.max(discountAmount, 0).toLocaleString()} VND</p>
      <p><strong>Phí vận chuyển:</strong> {(order.shippingFee || 0).toLocaleString()} VND</p>
      <hr className="border-gray-300" />
      <p className="text-2xl font-bold text-red-600">Tổng cộng: {(order.totalAmount || 0).toLocaleString()} VND</p>
    </div>

    {/* Nút quay lại */}
    <div className="mt-6 flex justify-start">
      <button
        onClick={() => navigate("/order-history")}
        className="px-5 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition font-medium"
      >
        ← Quay lại lịch sử đơn hàng
      </button>
    </div>
  </div>
);

};

export default OrderDetailPage;
