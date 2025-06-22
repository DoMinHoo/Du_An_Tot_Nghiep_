import React, { useEffect, useState } from 'react';
import axios from 'axios';

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/orders/user/${currentUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data.data || []);
      } catch (error) {
        console.error('Lỗi khi lấy đơn hàng:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?._id) {
      fetchOrders();
    }
  }, [currentUser, token]);

  if (loading) return <p className="text-center py-8">Đang tải lịch sử đơn hàng...</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Lịch sử đơn hàng</h2>
      {orders.length === 0 ? (
        <p>Chưa có đơn hàng nào.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="border p-4 rounded-md shadow-sm bg-white">
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
                <p><strong>Người nhận:</strong> {order.shippingAddress.fullName}</p>
                <p><strong>SĐT:</strong> {order.shippingAddress.phone}</p>
                {/* <p><strong>Email nhận hàng:</strong> {order.shippingAddress.email}</p> */}
                <p><strong>Email:</strong> {order.userId?.email}</p>
                <p><strong>Địa chỉ:</strong> {`${order.shippingAddress.addressLine}, ${order.shippingAddress.street}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}`}</p>
                <p><strong>Thanh toán:</strong> {order.paymentMethod === 'cod' ? 'COD' : order.paymentMethod}</p>
              </div>

              <div className="space-y-4">
                {order.items.map((group: any) => (
                  <div key={group.productId} className="border rounded-md p-3 bg-gray-50">
                    {/* <div className="flex items-center gap-4 mb-2">
                      <img src={group.image} alt={group.name} className="w-12 h-12 object-cover rounded" />
                      <div>
                        <p className="font-semibold">{group.name}</p>
                        <p className="text-sm text-gray-600">Thương hiệu: {group.brand}</p>
                        <p className="text-sm text-gray-600">Mô tả: {group.descriptionShort}</p>
                        <p className="text-sm text-gray-600">Tổng số lượng: {group.totalQuantity}</p>
                        <p className="text-sm text-gray-600">Tổng tiền: {group.totalPrice.toLocaleString()}₫</p>
                      </div>
                    </div> */}

                    {group.variations.map((v: any) => (
                      <div key={v.variationId} className="flex gap-4 items-center pt-2 mt-2">
                        <img src={v.colorImageUrl} alt={v.name} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <p className="font-medium">{v.name}</p>
                          <p className="text-gray-500 text-sm">Màu: {v.colorName}</p>
                          <p className="text-sm text-gray-500">SKU: {v.sku}</p>
                        </div>
                        <div className="text-right">
                          <p>{v.finalPrice.toLocaleString()}₫ x {v.quantity}</p>
                          <p className="font-semibold text-red-500">{v.subtotal.toLocaleString()}₫</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="text-right mt-4 text-lg font-semibold text-red-600">
                Tổng cộng: {order.totalAmount.toLocaleString()}₫
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
