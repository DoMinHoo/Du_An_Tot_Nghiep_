import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { message } from 'antd';

const cancelReasons = [
  'Thay đổi nhu cầu mua hàng',
  'Đặt nhầm sản phẩm hoặc số lượng',
  'Tìm thấy sản phẩm giá tốt hơn ở nơi khác',
  'Thời gian giao hàng quá lâu',
  'Thông tin đơn hàng sai (địa chỉ, số điện thoại, v.v.)',
];

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelReasonsMap, setCancelReasonsMap] = useState<Record<string, string>>({});

  const token = localStorage.getItem('token');
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || '{}');
    } catch {
      return {};
    }
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/orders/user/${currentUser._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(res.data.data || []);
    } catch (error) {
      console.error('Lỗi khi lấy đơn hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?._id) {
      fetchOrders();
    }
  }, [currentUser?._id, token]);

  const getEffectivePrice = (salePrice: number, finalPrice: number) => {
    return salePrice && salePrice < finalPrice ? salePrice : finalPrice;
  };

  const handleCancelOrder = async (orderId: string) => {
    const reason = cancelReasonsMap[orderId];

    if (!reason) {
      message.warning('Vui lòng chọn lý do hủy đơn hàng');
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/orders/${orderId}`,
        { status: 'canceled', note: reason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      message.success('Đã hủy đơn hàng');
      setCancelReasonsMap((prev) => ({ ...prev, [orderId]: '' }));
      fetchOrders();
    } catch (err) {
      message.error('Hủy đơn hàng thất bại');
    }
  };

  if (loading) return <p className="text-center py-8">Đang tải lịch sử đơn hàng...</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Lịch sử đơn hàng</h2>

      {orders.length === 0 ? (
        <p>Chưa có đơn hàng nào.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="border p-4 rounded-md shadow-sm bg-white"
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="text-lg font-medium">Mã đơn: {order.orderCode}</p>
                  <p className="text-sm text-gray-600">
                    Ngày đặt: {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-sm px-3 py-1 rounded bg-gray-100 text-gray-800">
                  <strong>{order.status.toUpperCase()}</strong>
                </div>
              </div>

              <div className="text-sm mb-4 space-y-1">
                <p>
                  <strong>Người nhận:</strong> {order.shippingAddress.fullName}
                </p>
                <p>
                  <strong>SĐT:</strong> {order.shippingAddress.phone}
                </p>
                <p>
                  <strong>Email:</strong> {order.userId?.email}
                </p>
                <p>
                  <strong>Địa chỉ:</strong>{' '}
                  {`${order.shippingAddress.addressLine}, ${order.shippingAddress.street}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}`}
                </p>
                <p>
                  <strong>Thanh toán:</strong>{' '}
                  {order.paymentMethod === 'cod'
                    ? 'COD'
                    : order.paymentMethod.toUpperCase()}
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
                            src={v.colorImageUrl}
                            alt={v.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{v.name}</p>
                            <p className="text-gray-500 text-sm">Màu: {v.colorName}</p>
                            <p className="text-sm text-gray-500">SKU: {v.sku}</p>
                          </div>
                          <div className="text-right">
                            <p>{price.toLocaleString()}₫ x {v.quantity}</p>
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

              <div className="text-right mt-4 text-lg font-semibold text-red-600">
                Tổng cộng: {order.totalAmount.toLocaleString()}₫
              </div>

              {order.status === 'pending' && (
                <div className="text-right mt-4 flex items-center justify-end gap-4">
                  <select
                    value={cancelReasonsMap[order._id] || ''}
                    onChange={(e) =>
                      setCancelReasonsMap((prev) => ({ ...prev, [order._id]: e.target.value }))
                    }
                    className="border px-3 py-1 rounded text-sm"
                    style={{ minWidth: 250 }}
                  >
                    <option value="">Chọn lý do huỷ đơn</option>
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
                    Huỷ đơn hàng
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
