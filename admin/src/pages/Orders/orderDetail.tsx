import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  Typography,
  Descriptions,
  Tag,
  Select,
  Button,
  Divider,
  List,
  message,
  Spin,
} from 'antd';
import { getOrderById, updateOrder } from '../../Services/orders.service';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const statusText: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao hàng',
  completed: 'Đã giao hàng',
  canceled: 'Đã hủy đơn',
};

const statusColor: Record<string, string> = {
  pending: 'default',
  confirmed: 'blue',
  shipping: 'orange',
  completed: 'green',
  canceled: 'red',
};
const paymentStatusText: Record<string, string> = {
  pending: 'Chưa thanh toán',
  completed: 'Đã thanh toán',
  failed: 'Thanh toán thất bại',
  refund_pending: "Chờ hoàn tiền",
  refunded: 'Đã hoàn tiền',
  expired: "Thanh toán hết hạn",
};


const getNextAvailableStatuses = (currentStatus: string): string[] => {
  const transitions: Record<string, string[]> = {
    pending: ['confirmed', 'canceled'],
    confirmed: ['shipping', 'canceled'],
    shipping: ['completed', 'canceled'],
    completed: [],
    canceled: [],
  };
  return transitions[currentStatus] || [];
};

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<{ value: string; label: string } | null>(
    null
  );
  const [note, setNote] = useState<string>('');

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await getOrderById(id!);
      setOrder(data);
      const currentStatus = data.status;
      setStatus({
        value: currentStatus,
        label: statusText[currentStatus] || currentStatus,
      });

      if (currentStatus === 'canceled') {
        const cancelEntry = data.statusHistory?.find(
          (entry: any) => entry.status === 'canceled'
        );
        if (cancelEntry?.note) {
          setNote(cancelEntry.note);
        }
      }
    } catch (error) {
      message.error('Không thể tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusChange = (option: { value: string; label: string }) => {
    setStatus(option);
    if (option.value !== 'canceled') {
      setNote('');
    }
  };

  const handleUpdateStatus = async () => {
    if (!status) return;

    // ✅ fetch lại đơn hàng để lấy trạng thái mới nhất
    const latestOrder = await getOrderById(id!);
    if (!latestOrder) {
      message.error('Không tìm thấy đơn hàng');
      return;
    }

    if (latestOrder.status === 'canceled' || latestOrder.status === 'completed') {
      message.warning('Khách hàng đã hủy đơn, không thể xác nhận');
      return;
    }

    const allowedStatuses = getNextAvailableStatuses(latestOrder.status);
    if (!allowedStatuses.includes(status.value)) {
      message.warning('Trạng thái không hợp lệ. Không thể cập nhật.');
      return;
    }

    if (status.value === 'canceled' && !note.trim()) {
      message.warning('Vui lòng nhập lý do huỷ đơn hàng');
      return;
    }

    try {
      await updateOrder(id!, { status: status.value, note });
      message.success('Cập nhật trạng thái thành công');
      navigate('/admin/orders', { state: { shouldRefresh: true } });
    } catch (error) {
      message.error('Cập nhật trạng thái thất bại');
    }
  };

  if (loading || !order) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  const availableStatuses = getNextAvailableStatuses(order.status);
  const shipping = order.shippingAddress || {};

  return (
    <Content style={{ margin: '24px', background: '#fff', padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Chi tiết đơn hàng #{order.orderCode}
        </Title>
        <Button onClick={() => navigate('/admin/orders')}>
          ← Quay lại danh sách
        </Button>
      </div>

      <Descriptions
        bordered
        column={1}
        style={{ marginBottom: 24, marginTop: 16 }}
      >
        {/* THÔNG TIN NGƯỜI ĐẶT */}
        <Descriptions.Item label="Tên người đặt">
          {order.customerName || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Email người đặt">
          {order.customerEmail || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Số điện thoại người đặt">
          {order.customerPhone || 'N/A'}
        </Descriptions.Item>
        {/* KẾT THÚC THÔNG TIN NGƯỜI ĐẶT */}

        {/* THÔNG TIN NGƯỜI NHẬN */}
        <Descriptions.Item label="Tên người nhận">
          {shipping.fullName || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Email người nhận">
          {shipping.email || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Số điện thoại người nhận">
          {shipping.phone || 'N/A'}
        </Descriptions.Item>

        <Descriptions.Item label="Địa chỉ giao hàng">
          {`${shipping.addressLine || ''}, ${shipping.street || ''}, ${shipping.ward || ''
            }, ${shipping.district || ''}, ${shipping.province || ''}`}
        </Descriptions.Item>
        {/* Thêm phí vận chuyển */}
        <Descriptions.Item label="Phí vận chuyển">
          {order.shippingFee?.toLocaleString('vi-VN') || '0'}₫
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái hiện tại">
          <Tag color={statusColor[order.status]}>
            {statusText[order.status] || order.status}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Phương thức thanh toán">
          {order.paymentMethod === 'cod'
            ? 'Thanh toán khi nhận hàng'
            : order.paymentMethod === 'online_payment'
              ? 'Thanh toán qua ZaloPay'
              : 'Chuyển khoản ngân hàng'}
        </Descriptions.Item>


        <Descriptions.Item label="Trạng thái thanh toán">
          {paymentStatusText[order.paymentStatus] || order.paymentStatus}
          {order.paymentStatus === 'refund_pending' && (
            <Button
              type="primary"
              style={{ marginLeft: 12 }}
              onClick={async () => {
                try {
                  await updateOrder(id!, { paymentStatus: 'refunded' });
                  message.success('Đã xác nhận hoàn tiền');
                  fetchOrder();
                } catch {
                  message.error('Xác nhận hoàn tiền thất bại');
                }
              }}
            >
              Đã hoàn tiền
            </Button>
          )}
        </Descriptions.Item>

        {order.status === 'canceled' && note && (
          <Descriptions.Item label="Lý do huỷ đơn hàng">
            <Text type="danger">{note}</Text>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Cập nhật trạng thái">
          {order.status === 'canceled' || order.status === 'completed' ? (
            <Text type="secondary">Đơn hàng đã kết thúc, không thể cập nhật</Text>
          ) : availableStatuses.length === 0 ? (
            <Text type="secondary">Không thể cập nhật trạng thái</Text>
          ) : (
            <>
              <Select
                labelInValue
                value={status}
                onChange={handleStatusChange}
                style={{ width: 250 }}
                placeholder="Chọn trạng thái mới"
              >
                {availableStatuses.map((s) => (
                  <Option key={s} value={s}>
                    {statusText[s] || s}
                  </Option>
                ))}
              </Select>

              {status?.value === 'canceled' && (
                <Select
                  value={note}
                  onChange={(value) => setNote(value)}
                  placeholder="Chọn lý do huỷ đơn hàng"
                  style={{ marginTop: 8, width: 400 }}
                >
                  <Option value="Khách hàng không xác nhận đơn">
                    Khách hàng không xác nhận đơn
                  </Option>
                  <Option value="Thông tin giao hàng không hợp lệ">
                    Thông tin giao hàng không hợp lệ
                  </Option>
                  <Option value="Sản phẩm hết hàng hoặc ngừng kinh doanh">
                    Sản phẩm hết hàng hoặc ngừng kinh doanh
                  </Option>
                  <Option value="Nghi ngờ gian lận hoặc giao dịch bất thường">
                    Nghi ngờ gian lận hoặc giao dịch bất thường
                  </Option>
                  <Option value="Khách hàng yêu cầu huỷ đơn">
                    Khách hàng yêu cầu huỷ đơn
                  </Option>
                </Select>
              )}

              <Button
                type="primary"
                onClick={handleUpdateStatus}
                style={{ marginLeft: 12 }}
              >
                Cập nhật
              </Button>
            </>
          )}
        </Descriptions.Item>
      </Descriptions>

      <Divider />
      <Title level={4}>Sản phẩm</Title>
      <List
        bordered
        dataSource={order.items}
        renderItem={(item: any) => {
          const productImage =
            Array.isArray(item.image) && item.image.length > 0
              ? item.image[0]
              : '/default-image.png';
          return (
            <List.Item style={{ padding: 16 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', gap: 16 }}>
                  <img
                    src={`http://localhost:5000${productImage}`}
                    alt={item.name}
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 8,
                      backgroundColor: '#f5f5f5',
                    }}
                  />
                  <div>
                    <div>
                      <strong>{item.name}</strong>
                    </div>
                    <div>SKU: {item.sku || 'Không có'}</div>
                    <div>Kích thước: {item.dimensions || 'Không xác định'}</div>
                    <div>Chất liệu: {item.material || 'Không xác định'}</div>
                    <div>
                      Màu sắc: {item.colorName || 'Không xác định'}{' '}
                      {item.colorImageUrl && (
                        <img
                          src={`http://localhost:5000${item.colorImageUrl}`}
                          alt={item.colorName}
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            marginLeft: 8,
                            verticalAlign: 'middle',
                            border: '1px solid #ddd',
                          }}
                        />
                      )}
                    </div>
                    <div>Số lượng: {item.quantity}</div>
                    <div>
                      Đơn giá: {item.salePrice?.toLocaleString('vi-VN')}₫
                    </div>
                  </div>

                </div>
              </div>
            </List.Item>
          );
        }}
      />
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        {/* Tính giá gốc (subtotal) */}
        <Text style={{ display: "block", fontSize: 16, marginBottom: 8 }}>
          Giá gốc:{" "}
          <span style={{ color: "#555" }}>
            {order?.items
              ?.reduce(
                (sum: number, item: any) => sum + item.salePrice * item.quantity,
                0
              )
              .toLocaleString("vi-VN")}₫
          </span>
        </Text>

        {/* Giảm giá nếu có */}
        {order?.promotion?.discountValue > 0 && (
          <Text style={{ display: "block", fontSize: 16, marginBottom: 8 }}>
            Giảm giá ({order?.promotion?.code}):{" "}
            <span style={{ color: "green" }}>
              -{order.promotion.discountValue.toLocaleString("vi-VN")}₫
            </span>
          </Text>
        )}

        {/* Phí vận chuyển */}
        <Text style={{ display: "block", fontSize: 16, marginBottom: 8 }}>
          Phí vận chuyển:{" "}
          <span style={{ color: "#555" }}>
            {order?.shippingFee?.toLocaleString("vi-VN") || 0}₫
          </span>
        </Text>

        {/* Tổng cuối */}
        <Text strong style={{ fontSize: 18 }}>
          Tổng cuối:{" "}
          <span style={{ color: "red" }}>
            {(order?.totalAmount ?? 0).toLocaleString("vi-VN")}₫
          </span>
        </Text>
      </div>

      <Divider />
      <Title level={4}>Lịch sử trạng thái</Title>
      <List
        bordered
        dataSource={order.statusHistory}
        renderItem={(entry: any) => (
          <List.Item>
            <Text strong>{statusText[entry.status] || entry.status}</Text> –{' '}
            {new Date(entry.changedAt).toLocaleString('vi-VN')}
          </List.Item>
        )}
      />
    </Content>
  );
};

export default OrderDetail;