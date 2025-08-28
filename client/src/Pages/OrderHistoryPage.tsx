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
    <div className="container mx-auto px-4 py-8">
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

      <h2 className="text-2xl font-semibold mb-6">Lịch sử đơn hàng</h2>

      {orders.length === 0 ? (
        <p>Chưa có đơn hàng nào.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            // Tính subtotal cho mỗi đơn hàng
            const subtotal = calculateSubtotal(order);

            // Tính discountAmount dựa trên hàm getDiscountAmount
            const discountAmount = getDiscountAmount(order, subtotal);

            return (
              <div
                key={order._id}
                className="border p-4 rounded-md shadow-sm bg-white"
              >
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-lg font-medium">
                      Mã đơn: {order.orderCode}
                    </p>
                    <p className="text-sm text-gray-600">
                      Ngày đặt:{' '}
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className="text-sm px-3 py-1 rounded bg-gray-100 text-gray-800">
                    <strong>{statusText[order.status] || order.status}</strong>
                  </div>
                </div>

                <div className="text-sm mb-4 space-y-1">
                  <p>
                    <strong>Người nhận:</strong>{' '}
                    {order.shippingAddress.fullName}
                  </p>
                  <p>
                    <strong>SĐT:</strong> {order.shippingAddress.phone}
                  </p>
                  <p>
                    <strong>Email:</strong> {order.shippingAddress.email}
                  </p>
                  <p>
                    <strong>Địa chỉ:</strong>{' '}
                    {`${order.shippingAddress.addressLine}, ${order.shippingAddress.street}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}`}
                  </p>
                  <p>
                    <strong>Phương thức thanh toán:</strong>{' '}
                    {order.paymentMethod === 'cod'
                      ? 'Thanh toán khi nhận hàng'
                      : 'Thanh toán online'}
                  </p>
                  <p>
                    <strong>Trạng thái thanh toán:</strong>{' '}
                    {getPaymentStatusText(order)}
                  </p>
                </div>

                <div className="space-y-4">
                  {order.items.map((group: any) => (
                    <div
                      key={group.productId}
                      className="border rounded-md p-3 bg-gray-50"
                    >
                      {group.variations.map((v: any) => {
                        const price = getEffectivePrice(
                          v.salePrice,
                          v.finalPrice
                        );
                        return (
                          <div
                            key={v.variationId}
                            className="flex gap-4 items-center pt-2 mt-2"
                          >
                            <img
                              src={getImageUrl(v.colorImageUrl || group.image)}
                              alt={v.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{v.name}</p>
                              <p className="text-gray-500 text-sm">
                                Màu: {v.colorName}
                              </p>
                              <p className="text-sm text-gray-500">
                                SKU: {v.sku}
                              </p>
                            </div>
                            <div className="text-right">
                              <p>
                                {price.toLocaleString()}₫ x {v.quantity}
                              </p>
                              <p className="font-semibold text-red-500">
                                {(price * v.quantity).toLocaleString()}₫
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="text-right mt-4 text-lg font-semibold">
                  <p>
                    <strong>Tổng tiền hàng:</strong> {subtotal.toLocaleString()}
                    ₫
                  </p>
                  <p>
                    <strong>Mã giảm giá:</strong>{' '}
                    {order.promotion?.code
                      ? `${order.promotion.code} (${
                          order.promotion.discountType === 'percentage'
                            ? `${order.promotion.discountValue}%`
                            : `${order.promotion.discountValue.toLocaleString()}₫`
                        })`
                      : 'Không áp dụng'}
                  </p>

                  <p>
                    <strong>Giá trị giảm:</strong>{' '}
                    {Math.max(discountAmount, 0).toLocaleString()}₫
                  </p>

                  <p>
                    <strong>Phí vận chuyển:</strong>{' '}
                    {order.shippingFee?.toLocaleString() || '0'}₫
                  </p>

                  <hr className="my-2" />

                  <p className="text-lg font-semibold text-red-600">
                    Tổng cộng: {order.totalAmount?.toLocaleString() || '0'}₫
                  </p>
                </div>

                {order.status === 'pending' && (
                  <div className="text-right mt-4 flex flex-wrap items-center justify-end gap-4">
                    {order.paymentMethod === 'online_payment' &&
                      order.paymentStatus === 'pending' && (
                        <button
                          onClick={() => handleRetryPayment(order.orderCode)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Thanh toán lại qua ZaloPay
                        </button>
                      )}

                    <select
                      value={cancelReasonsMap[order._id] || ''}
                      onChange={(e) =>
                        setCancelReasonsMap((prev) => ({
                          ...prev,
                          [order._id]: e.target.value,
                        }))
                      }
                      className="border px-3 py-1 rounded text-sm"
                      style={{ minWidth: 250 }}
                    >
                      <option value="">Chọn lý do hủy đơn</option>
                      {cancelReasons.map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Hủy đơn hàng
                    </button>
                  </div>
                )}
                {order.status === 'confirmed' && (
                  <div className="text-right mt-4">
                    <p className="text-sm text-gray-600 italic">
                      Đơn hàng đã được xác nhận, không thể hủy.
                    </p>
                  </div>
                )}

                {order.status === 'shipping' && (
                  <div className="text-right mt-4">
                    <p className="text-sm text-gray-600 italic">
                      Đơn hàng đang giao, không thể hủy.
                    </p>
                    <button
                      onClick={() => handleConfirmReceived(order._id)}
                      className="px-4 py-2 mt-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Xác nhận đã nhận hàng
                    </button>
                  </div>
                )}
                <div className="text-right mt-4">
                  <button
                    onClick={() =>
                      (window.location.href = `/order-detail/${order._id}`)
                    }
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            );
          })}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
              <button
                onClick={() => handleChangePage(page - 1)}
                disabled={page === 1}
                className={`px-3 py-1 border rounded ${
                  page === 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100'
                }`}
              >
                Trước
              </button>

              {Array.from(
                { length: pagination.totalPages },
                (_, index) => index + 1
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => handleChangePage(p)}
                  className={`px-3 py-1 border rounded ${
                    page === p ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => handleChangePage(page + 1)}
                disabled={page === pagination.totalPages}
                className={`px-3 py-1 border rounded ${
                  page === pagination.totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100'
                }`}
              >
                Sau
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
