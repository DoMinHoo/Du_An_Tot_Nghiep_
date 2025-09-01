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

const API_BASE = 'http://localhost:5000'; // sửa nếu cần

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<{ value: string; label: string } | null>(null);
  const [note, setNote] = useState<string>('');

  // states cho promotion từ DB
  const [promoFromDb, setPromoFromDb] = useState<any | null>(null);
  const [discountFromDb, setDiscountFromDb] = useState<number | null>(null);
  const [checkingPromo, setCheckingPromo] = useState<boolean>(false);

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

  // Hàm check promotion từ DB / API và tính discount dựa trên subtotal
  const checkPromotion = async (code: string, subtotal: number) => {
    if (!code) return;
    setCheckingPromo(true);
    setPromoFromDb(null);
    setDiscountFromDb(null);

    try {
      // 1) Thử GET chi tiết promotion (nếu bạn có route GET /api/promotions/:code)
      let promo: any = null;
      try {
        const res = await fetch(`${API_BASE}/api/promotions/${encodeURIComponent(code)}`);
        if (res.ok) {
          const json = await res.json();
          // backend có thể trả về { success: true, data: promo } hoặc promo trực tiếp
          promo = json.data || json || null;
        }
      } catch (err) {
        // ignore get error, sẽ fallback xuống apply endpoint
        console.debug('GET promotion by code failed, fallback to apply', err);
      }

      // 2) Nếu không có endpoint GET hoặc server không trả promotion, fallback sang apply để lấy discountComputed
      if (!promo) {
        try {
          const res2 = await fetch(`${API_BASE}/api/promotions/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code.trim(), originalPrice: subtotal }),
          });
          const j2 = await res2.json();
          // endpoint apply thường trả finalPrice, discountAmount, promotion info...
          if (res2.ok) {
            // dùng thông tin trả về để populate
            promo = j2.promotion || j2.data || { code };
            const discountAmount = j2.discountAmount ?? j2.discount ?? 0;
            setPromoFromDb(promo);
            setDiscountFromDb(typeof discountAmount === 'number' ? discountAmount : Number(discountAmount || 0));
            setCheckingPromo(false);
            return;
          } else {
            // không ok: vẫn tiếp tục - promo null
            console.warn('apply promo not ok', j2);
          }
        } catch (err) {
          console.debug('apply promotion failed', err);
        }
      }

      // Nếu đã có promo object từ GET:
      if (promo) {
        // chuẩn hoá tên trường nếu cần
        const discountType = promo.discountType;
        const discountValue = Number(promo.discountValue || promo.value || 0);
        const maxDiscountPrice = Number(promo.maxDiscountPrice || promo.max || 0);
        const minOrderValue = Number(promo.minOrderValue || promo.minimumOrderValue || 0);

        // nếu subtotal chưa đạt minOrderValue => discount 0
        if (minOrderValue && subtotal < minOrderValue) {
          setPromoFromDb(promo);
          setDiscountFromDb(0);
          setCheckingPromo(false);
          return;
        }

        let computed = 0;
        if (discountType === 'percentage') {
          computed = Math.floor((subtotal * discountValue) / 100);
          if (maxDiscountPrice && maxDiscountPrice > 0) {
            computed = Math.min(computed, maxDiscountPrice);
          }
        } else {
          // fixed
          computed = discountValue;
          if (maxDiscountPrice && maxDiscountPrice > 0) {
            computed = Math.min(computed, maxDiscountPrice);
          }
        }

        setPromoFromDb(promo);
        setDiscountFromDb(Math.max(0, Math.floor(computed)));
      }
    } catch (err) {
      console.error('checkPromotion error', err);
    } finally {
      setCheckingPromo(false);
    }
  };

  useEffect(() => {
    // Khi order được load, tính subtotal rồi call checkPromotion nếu có code
    if (!order) return;
    const subtotal = order?.subtotal ??
      (order?.items?.reduce((s: number, it: any) => s + ((it.subtotal ?? (it.salePrice || 0) * (it.quantity || 0)) || 0), 0) || 0);

    const code = order?.promotion?.code || order?.couponCode || order?.promotionCode || null;
    if (code) {
      checkPromotion(code, subtotal);
    } else {
      // reset nếu không có code
      setPromoFromDb(null);
      setDiscountFromDb(null);
    }
  }, [order]);

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
  const subtotal = order?.subtotal ??
    (order?.items?.reduce((s: any, it: any) => s + ((it.subtotal ?? (it.salePrice || 0) * (it.quantity || 0)) || 0), 0) || 0);

  // ưu tiên dùng discountFromDb (từ DB/apply). nếu null, try use order.discount (server-chưa-populate) hoặc derived
  let discountAmount = discountFromDb ?? (typeof order?.discount === 'number' ? order.discount : null);

  if ((discountAmount === null || discountAmount === 0) && order?.promotion) {
    // dự phòng: nếu backend lưu promotion đầy đủ trong order, tính tạm
    const promo = order.promotion;
    if (promo) {
      if (promo.discountType === 'percentage') {
        let computed = Math.floor((subtotal * (promo.discountValue || 0)) / 100);
        if (promo.maxDiscountPrice && promo.maxDiscountPrice > 0) {
          computed = Math.min(computed, promo.maxDiscountPrice);
        }
        discountAmount = computed;
      } else {
        discountAmount = promo.discountValue || 0;
      }
    }
  }

  // fallback: derive từ tổng (nếu backend chỉ lưu totalAmount)
  if ((discountAmount === null || discountAmount === 0) && typeof order?.totalAmount === 'number') {
    const derived = subtotal + (order.shippingFee || 0) - order.totalAmount;
    if (derived > 0) discountAmount = derived;
  }

  // ensure number
  discountAmount = Math.max(0, Number(discountAmount || 0));
  const totalFinal = order?.totalAmount ?? (subtotal - discountAmount + (order?.shippingFee || 0));

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

        <Descriptions.Item label="Phí vận chuyển">
          {order.shippingFee?.toLocaleString('vi-VN') || '0'}VND
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
   : order.paymentMethod === 'wallet'
    ? 'Thanh toán bằng Ví'
    : 'Không xác định'}
    
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
                      Đơn giá: {item.salePrice?.toLocaleString('vi-VN')}VND
                    </div>
                  </div>
                </div>
              </div>
            </List.Item>
          );
        }}
      />
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Text style={{ display: "block", fontSize: 16, marginBottom: 8 }}>
          Giá gốc: <span style={{ color: "#555" }}>{subtotal.toLocaleString("vi-VN")}VND</span>
        </Text>

        <Text style={{ display: "block", fontSize: 16, marginBottom: 8 }}>
          Mã giảm giá:{" "}
          <span style={{ color: "#555" }}>
            {order?.promotion?.code || promoFromDb?.code
              ? `${order?.promotion?.code || promoFromDb?.code} (${(order?.promotion?.discountType || promoFromDb?.discountType) === 'percentage' ? `${(order?.promotion?.discountValue || promoFromDb?.discountValue)}%` : `${(order?.promotion?.discountValue || promoFromDb?.discountValue)?.toLocaleString('vi-VN')}VND`})`
              : 'Không áp dụng'}
          </span>
        </Text>

        {checkingPromo && <Text style={{ display: "block", fontSize: 14, marginBottom: 8, color: '#888' }}>Đang kiểm tra mã khuyến mãi…</Text>}

        {discountAmount > 0 && (
          <Text style={{ display: "block", fontSize: 16, marginBottom: 8 }}>
            Giảm giá: <span style={{ color: "green" }}>-{discountAmount.toLocaleString("vi-VN")}VND</span>
            {(order?.promotion?.discountType || promoFromDb?.discountType) === 'percentage'
            }
          </Text>
        )}

        <Text style={{ display: "block", fontSize: 16, marginBottom: 8 }}>
          Phí vận chuyển: <span style={{ color: "#555" }}>{(order?.shippingFee || 0).toLocaleString("vi-VN")}VND</span>
        </Text>

        <Text strong style={{ fontSize: 18 }}>
          Tổng cuối: <span style={{ color: "red" }}>{(totalFinal ?? 0).toLocaleString("vi-VN")}VND</span>
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
