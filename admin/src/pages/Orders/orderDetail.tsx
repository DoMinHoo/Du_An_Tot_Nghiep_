import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
} from "antd";
import { getOrderById, updateOrder } from "../../Services/orders.service";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const statusText: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  completed: "Đã giao",
  canceled: "Đã hủy",
};

const statusColor: Record<string, string> = {
  pending: "default",
  confirmed: "blue",
  shipping: "orange",
  completed: "green",
  canceled: "red", // ✅ Màu đỏ cho trạng thái đã huỷ
};

const getNextAvailableStatuses = (currentStatus: string): string[] => {
  const transitions: Record<string, string[]> = {
    pending: ["confirmed", "canceled"],
    confirmed: ["shipping", "canceled"],
    shipping: ["completed", "canceled"],
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
  const [status, setStatus] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await getOrderById(id!);
      setOrder(data);
      setStatus(data.status);
      if (data.status === "canceled") {
        const cancelEntry = data.statusHistory?.find(
          (entry: any) => entry.status === "canceled"
        );
        if (cancelEntry?.note) {
          setNote(cancelEntry.note);
        }
      }
    } catch (error) {
      message.error("Không thể tải chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    if (value !== "canceled") {
      setNote("");
    }
  };

  const handleUpdateStatus = async () => {
    const allowedStatuses = getNextAvailableStatuses(order.status);
    if (!allowedStatuses.includes(status)) {
      message.warning("Trạng thái không hợp lệ. Không thể cập nhật.");
      return;
    }

    if (status === "canceled" && !note.trim()) {
      message.warning("Vui lòng nhập lý do huỷ đơn hàng");
      return;
    }

    try {
      await updateOrder(id!, { status, note });
      message.success("Cập nhật trạng thái thành công");
      navigate("/admin/orders", { state: { shouldRefresh: true } });
    } catch (error) {
      message.error("Cập nhật trạng thái thất bại");
    }
  };

  if (loading || !order) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  const availableStatuses = getNextAvailableStatuses(order.status);
  const shipping = order.shippingAddress || {};

  return (
    <Content style={{ margin: "24px", background: "#fff", padding: 24 }}>
      <Title level={3}>Chi tiết đơn hàng #{order.orderCode}</Title>
      <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Tên khách hàng">
          {shipping.fullName || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Email">
          {shipping.email || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Số điện thoại">
          {shipping.phone || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Địa chỉ giao hàng">
          {`${shipping.addressLine || ""}, ${shipping.street || ""}, ${shipping.ward || ""}, ${shipping.district || ""}, ${shipping.province || ""}`}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái hiện tại">
          <Tag color={statusColor[order.status]}>
            {statusText[order.status] || order.status}
          </Tag>
        </Descriptions.Item>
        {order.status === "canceled" && note && (
          <Descriptions.Item label="Lý do huỷ đơn hàng">
            <Text type="danger">{note}</Text>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Cập nhật trạng thái">
          {availableStatuses.length === 0 ? (
            <Text type="secondary">Không thể cập nhật trạng thái</Text>
          ) : (
            <>
              <Select
                value={status}
                onChange={handleStatusChange}
                style={{ width: 200 }}
              >
                {availableStatuses.map((s) => (
                  <Option key={s} value={s}>
                    {statusText[s] || s}
                  </Option>
                ))}
              </Select>
              {status === "canceled" && (
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
        renderItem={(item: any) => (
          <List.Item>
            {item.name} x{item.quantity} –{" "}
            {item.price ? item.price.toLocaleString("vi-VN") : "N/A"}₫
          </List.Item>
        )}
      />

      <Divider />
      <Title level={4}>Lịch sử trạng thái</Title>
      <List
        bordered
        dataSource={order.statusHistory}
        renderItem={(entry: any) => (
          <List.Item>
            <Text strong>{statusText[entry.status] || entry.status}</Text> –{" "}
            {new Date(entry.changedAt).toLocaleString("vi-VN")}
          </List.Item>
        )}
      />
    </Content>
  );
};

export default OrderDetail;
