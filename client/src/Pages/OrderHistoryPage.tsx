import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { message } from 'antd';
import { getImageUrl } from '../utils/imageUtils';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const cancelReasons = [
  'Thay đổi nhu cầu mua hàng',
  'Đặt nhầm sản phẩm hoặc số lượng',
  'Tìm thấy sản phẩm giá tốt hơn ở nơi khác',
  'Thời gian giao hàng quá lâu',
  'Thông tin đơn hàng sai (địa chỉ, số điện thoại, v.v.)',
];

const statusText: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao hàng',
  completed: 'Đã giao hàng',
  canceled: 'Đã hủy đơn',
};

const getPaymentStatusText = (order: any): string => {
  switch (order.paymentStatus) {
    case 'pending':
      return 'Chưa thanh toán';
    case 'completed':
      return 'Đã thanh toán';
    case 'failed':
      return 'Thanh toán thất bại';
    case 'refund_pending':
      return 'Chờ hoàn tiền';
    case 'refunded':
      return 'Đã hoàn tiền';
    case 'expired':
      return 'Thanh toán hết hạn';
    default:
      return 'Không xác định';
  }
};

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelReasonsMap, setCancelReasonsMap] = useState<
    Record<string, string>
  >({});
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  const token = sessionStorage.getItem('token');
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    } catch {
      return {};
    }
  }, []);

  const fetchOrders = async (pageNumber = page) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/orders/user/${currentUser._id}?page=${pageNumber}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders(res.data.data || []);
      setPagination(
        res.data.pagination || { total: 0, page: 1, totalPages: 1 }
      );
    } catch (error) {
      console.error('Lỗi khi lấy đơn hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
      fetchOrders(newPage);
    }
  };

  useEffect(() => {
    if (currentUser?._id) {
      fetchOrders();
    }
  }, [currentUser?._id, token]);

  // Tích hợp socket.io để lắng nghe cập nhật đơn hàng thời gian thực
  useEffect(() => {
    const socket = (window as any).socket;
    if (socket) {
      socket.on('order-updated', (data: any) => {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order._id === data.orderId
              ? {
                ...order,
                status: data.status,
                paymentStatus: data.paymentStatus,
              }
              : order
          )
        );
        // toast.info(
        //   `Đơn hàng ${data.orderCode} đã cập nhật trạng thái: ${
        //     statusText[data.status] || data.status
        //   }`
        // );
      });

      socket.on('new-order-' + currentUser._id, (data: any) => {
        toast.success(data.message);
        fetchOrders(); // Tải lại danh sách để thêm đơn hàng mới
      });

      return () => {
        socket.off('order-updated');
        socket.off('new-order-' + currentUser._id);
      };
    }
  }, [currentUser._id]);

  const getEffectivePrice = (salePrice: number, finalPrice: number) => {
    return salePrice && salePrice < finalPrice ? salePrice : finalPrice;
  };

  const handleCancelOrder = async (orderId: string) => {
    const reason = cancelReasonsMap[orderId];

    if (!reason) {
      toast.warning('Vui lòng chọn lý do hủy đơn hàng');
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:5000/api/orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const latestStatus = res.data.data?.status;
      if (latestStatus !== 'pending') {
        const readableStatus = statusText[latestStatus] || latestStatus;
        toast.warning(
          `Đơn hàng đã ${readableStatus.toLowerCase()} và không thể hủy.`
        );
        fetchOrders();
        return;
      }

      await axios.put(
        `http://localhost:5000/api/orders/${orderId}`,
        { status: 'canceled', note: reason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success('Đã hủy đơn hàng thành công');
      setCancelReasonsMap((prev) => ({ ...prev, [orderId]: '' }));
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast.error('Hủy đơn hàng thất bại. Vui lòng thử lại sau.');
    }
  };

  const handleRetryPayment = async (orderCode: string) => {
    try {
      message.loading({
        content: 'Đang tạo lại liên kết thanh toán...',
        key: 'retry',
      });

      const res = await axios.post(
        'http://localhost:5000/api/zalo-payment/create-payment',
        { orderCode },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.order_url) {
        message.success({
          content: 'Chuyển hướng đến ZaloPay...',
          key: 'retry',
        });
        localStorage.setItem('currentOrderCode', orderCode);
        window.location.href = res.data.order_url;
      } else {
        message.error('Không lấy được liên kết thanh toán.');
      }
    } catch (err) {
      console.error(err);
      message.error('Tạo lại thanh toán thất bại.');
    }
  };

  const handleConfirmReceived = async (orderId: string) => {
    try {
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}`,
        { status: 'completed', note: 'Khách hàng xác nhận đã nhận hàng' },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      message.success('Xác nhận đã nhận hàng thành công');
      fetchOrders();
    } catch (err) {
      message.error('Xác nhận thất bại');
    }
  };

  // 1. Hàm tính tổng tiền hàng (subtotal)
  const calculateSubtotal = (order: any): number => {
    let subtotal = 0;
    order.items.forEach((group: any) => {
      group.variations.forEach((v: any) => {
        const price = getEffectivePrice(v.salePrice, v.finalPrice);
        subtotal += price * v.quantity;
      });
    });
    return subtotal;
  };

  // 2. Sửa lại hàm getDiscountAmount để nhận subtotal
  const getDiscountAmount = (order: any, subtotal: number): number => {
    if (!order.promotion) return 0;
    if (order.promotion.discountType === 'percentage') {
      // Tính phần trăm dựa trên subtotal
      return Math.floor((subtotal * order.promotion.discountValue) / 100);
    }
    // Nếu là fixed amount, trả về giá trị giảm giá trực tiếp
    return order.promotion.discountValue;
  };

  if (loading)
    return <p className="text-center py-8">Đang tải lịch sử đơn hàng...</p>;

  return (
  <div className="bg-gray-30 min-h-screen py-10">
    <div className="container mx-auto px-4">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        transition={Slide}
      />

      <h2 className="text-3xl font-bold mb-10 text-gray-900">Lịch sử đơn hàng</h2>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-center py-20">Chưa có đơn hàng nào.</p>
      ) : (
        <div className="space-y-12">
          {orders.map((order) => {
            const subtotal = calculateSubtotal(order);
            const discountAmount = subtotal + (order.shippingFee || 0) - (order.totalAmount || 0);

            return (
              <div
                key={order._id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-6 flex-wrap gap-2">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">Mã đơn: {order.orderCode}</p>
                    <p className="text-sm text-gray-500">
                      Ngày đặt: {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      order.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : order.status === "confirmed"
                        ? "bg-blue-100 text-blue-800"
                        : order.status === "shipping"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {statusText[order.status] || order.status}
                  </div>
                </div>

                {/* Shipping Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-6">
                  <div>
                    <p><strong>Người nhận:</strong> {order.shippingAddress.fullName}</p>
                    <p><strong>SĐT:</strong> {order.shippingAddress.phone}</p>
                    <p><strong>Email:</strong> {order.shippingAddress.email}</p>
                  </div>
                  <div>
                    <p><strong>Địa chỉ:</strong> {`${order.shippingAddress.addressLine}, ${order.shippingAddress.street}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}`}</p>
                    <p><strong>Phương thức thanh toán:</strong> {order.paymentMethod === "cod" ? "Thanh toán khi nhận hàng" : order.paymentMethod === "online_payment" ? "Thanh toán qua ZaloPay" : order.paymentMethod === "wallet" ? "Thanh toán bằng Ví" : "Không xác định"}</p>
                    <p><strong>Trạng thái thanh toán:</strong> {getPaymentStatusText(order)}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-6 mb-6">
                  {order.items.map((group) => (
                    <div key={group.productId} className="bg-gray-50 rounded-md p-5 flex flex-col md:flex-row gap-4 items-center">
                      {group.variations.map((v) => {
                        const price = getEffectivePrice(v.salePrice, v.finalPrice);
                        return (
                          <div key={v.variationId} className="flex items-center gap-4 w-full">
                            <img
                              src={getImageUrl(v.colorImageUrl || group.image)}
                              alt={v.name}
                              className="w-24 h-24 object-cover rounded-lg hover:scale-105 transition-transform"
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{v.name}</p>
                              <p className="text-gray-500 text-sm">Màu: {v.colorName}</p>
                              <p className="text-gray-400 text-xs">SKU: {v.sku}</p>
                            </div>
                            <div className="text-right min-w-[100px]">
                              <p className="text-gray-700">{price.toLocaleString()} VND x {v.quantity}</p>
                              <p className="font-bold text-red-600">{(price * v.quantity).toLocaleString()} VND</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="text-right pt-4 border-t border-gray-200 space-y-2 text-gray-700">
                  <p><strong>Tổng tiền hàng:</strong> {subtotal.toLocaleString()} VND</p>
                  <p><strong>Mã giảm giá:</strong> {order.promotion?.code ? `${order.promotion.code} (${order.promotion.discountType === "percentage" ? `${order.promotion.discountValue}%` : `${order.promotion.discountValue.toLocaleString()}₫`})` : "Không áp dụng"}</p>
                  <p><strong>Giá trị giảm:</strong> {Math.max(discountAmount, 0).toLocaleString()} VND</p>
                  <p><strong>Phí vận chuyển:</strong> {order.shippingFee?.toLocaleString() || 0} VND</p>
                  <p className="text-2xl font-bold text-red-600">Tổng cộng: {order.totalAmount?.toLocaleString() || 0} VND</p>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex flex-wrap gap-3 justify-end">
                  {order.status === "pending" && order.paymentMethod === "online_payment" && order.paymentStatus === "pending" && (
                    <button onClick={() => handleRetryPayment(order.orderCode)} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Thanh toán lại</button>
                  )}
                  {order.status === "pending" && (
                    <>
                      <select value={cancelReasonsMap[order._id] || ""} onChange={(e) => setCancelReasonsMap(prev => ({...prev, [order._id]: e.target.value}))} className="border px-3 py-1 rounded-lg text-sm" style={{ minWidth: 220 }}>
                        <option value="">Chọn lý do hủy đơn</option>
                        {cancelReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                      </select>
                      <button onClick={() => handleCancelOrder(order._id)} className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">Hủy đơn hàng</button>
                    </>
                  )}
                  {order.status === "shipping" && (
                    <button onClick={() => handleConfirmReceived(order._id)} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Xác nhận đã nhận hàng</button>
                  )}
                  <button onClick={() => (window.location.href = `/order-detail/${order._id}`)} className="px-5 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition">Xem chi tiết</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

};

export default OrderHistoryPage;
