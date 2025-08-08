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

  const getDiscountAmount = () => {
    if (!order?.promotion) return 0;
    const subtotal = calculateSubtotal();
    if (order.promotion.discountType === "percentage") {
      return Math.floor((subtotal * order.promotion.discountValue) / 100);
    }
    return order.promotion.discountValue || 0;
  };

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
  const discountAmount = getDiscountAmount();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Chi tiết đơn hàng</h1>

      {/* Thông tin chung */}
      <div className="bg-white rounded shadow p-4 mb-6 space-y-2">
        <p><strong>Mã đơn:</strong> {order.orderCode}</p>
        <p><strong>Ngày đặt:</strong> {new Date(order.createdAt).toLocaleString("vi-VN")}</p>
        <p><strong>Trạng thái đơn:</strong> {statusText[order.status]}</p>
        <p><strong>Thanh toán:</strong> {paymentStatusText[order.paymentStatus]}</p>
        <p><strong>Phương thức:</strong> {
          order.paymentMethod === "cod"
            ? "Thanh toán khi nhận hàng"
            : order.paymentMethod === "online_payment"
              ? "Thanh toán qua ZaloPay"
              : "Chuyển khoản"
        }</p>
      </div>

      {/* Người nhận */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Thông tin người nhận</h2>
        <p><strong>Họ tên:</strong> {order.shippingAddress.fullName}</p>
        <p><strong>SĐT:</strong> {order.shippingAddress.phone}</p>
        <p><strong>Email:</strong> {order.shippingAddress.email}</p>
        <p><strong>Địa chỉ:</strong> {`${order.shippingAddress.addressLine}, ${order.shippingAddress.street}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}`}</p>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Sản phẩm</h2>
        <div className="space-y-4">
          {order.items.map((item: any, idx: number) => (
            <div key={idx} className="flex gap-4 items-center border-b pb-4">
              <img
                src={getImageUrl(item.colorImageUrl) || "/placeholder.svg"}
                alt={item.name}
                className="w-20 h-20 object-cover rounded border"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/default-product.jpg";
                }}
              />
              <div className="flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-600">Màu: {item.colorName}</p>
                <p className="text-sm text-gray-600">Kích thước: {item.dimensions}</p>
                <p className="text-sm text-gray-600">Chất liệu: {item.material}</p>
                {item.sku && <p className="text-sm text-gray-500">SKU: {item.sku}</p>}
              </div>
              <div className="text-right">
                <p>{(item.salePrice || 0).toLocaleString()}₫ x {item.quantity}</p>
                <p className="font-bold text-red-600">{(item.subtotal || 0).toLocaleString()}₫</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tổng tiền */}
      <div className="bg-white rounded shadow p-4 text-right space-y-2 text-gray-800 font-medium">
        <p>Tổng tiền hàng: {subtotal.toLocaleString()}₫</p>
        <p>
          Mã giảm giá:{" "}
          {order.promotion?.code
            ? `${order.promotion.code} (${order.promotion.discountType === "percentage"
              ? `${order.promotion.discountValue}%`
              : `${order.promotion.discountValue.toLocaleString()}₫`})`
            : "Không áp dụng"}
        </p>
        <p>Giảm giá: -{discountAmount.toLocaleString()}₫</p>
        <p>Phí vận chuyển: {(order.shippingFee || 0).toLocaleString()}₫</p>
        <hr />
        <p className="text-xl font-bold text-red-600">Tổng cộng: {(order.totalAmount || 0).toLocaleString()}₫</p>
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate("/order-history")}
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
        >
          ← Quay lại lịch sử đơn hàng
        </button>
      </div>
    </div>
  );
};

export default OrderDetailPage;
