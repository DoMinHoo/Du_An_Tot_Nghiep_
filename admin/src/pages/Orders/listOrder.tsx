import React, { useEffect, useState } from "react";
import {
  Layout,
  Button,
  Input,
  Table,
  Space,
  Popconfirm,
  message,
  Spin,
} from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const { Content } = Layout;

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface StatusEntry {
  status: string;
  changedAt: string;
}

interface Order {
  _id: string;
  orderCode: string;
  customerName: string;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
  statusHistory: StatusEntry[];
  key: number;
}

const OrderManager: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/orders");
      console.log("💡 API response:", res.data);
      const ordersData = res.data.data as Order[];
      setOrders(
        ordersData.map((order, index) => ({
          ...order,
          key: index + 1,
        }))
      );
    } catch (err) {
      message.error("Lỗi khi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/orders/${id}`);
      message.success("Xóa đơn hàng thành công");
      fetchOrders();
    } catch (err) {
      message.error("Xóa đơn hàng thất bại");
    }
  };

  const handleViewDetail = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(
    (order) =>
      order.orderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "STT",
      dataIndex: "key",
      key: "key",
    },
    {
      title: "Mã đơn hàng",
      dataIndex: "orderCode",
      key: "orderCode",
    },
    {
      title: "Khách hàng",
      dataIndex: "customerName",
      key: "customerName",
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) => (amount ? amount.toLocaleString("vi-VN") + "₫" : "N/A"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Địa chỉ giao hàng",
      dataIndex: "shippingAddress",
      key: "shippingAddress",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (date ? new Date(date).toLocaleString("vi-VN") : "N/A"),
    },
    {
      title: "Sản phẩm",
      dataIndex: "items",
      key: "items",
      render: (items: OrderItem[] = []) =>
        items.length > 0
          ? items.map((item, i) => (
              <div key={i}>
                {item.name} x{item.quantity} – {item.price ? item.price.toLocaleString("vi-VN") : "N/A"}₫
              </div>
            ))
          : "Không có sản phẩm",
    },
    {
      title: "Lịch sử trạng thái",
      dataIndex: "statusHistory",
      key: "statusHistory",
      render: (history: StatusEntry[] = []) =>
        history.length > 0
          ? history.map((item, i) => (
              <div key={i}>
                {item.status} ({item.changedAt ? new Date(item.changedAt).toLocaleString("vi-VN") : "N/A"})
              </div>
            ))
          : "Chưa có lịch sử",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: Order) => (
        <Space>
          <Button type="primary" onClick={() => handleViewDetail(record._id)}>
            Chi tiết
          </Button>
          <Popconfirm
            title="Xóa đơn hàng"
            description="Bạn có chắc muốn xóa đơn hàng này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Content style={{ margin: "24px", background: "#fff", padding: 24 }}>
      <Input
        placeholder="Tìm kiếm đơn hàng..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: 300, marginBottom: 16 }}
      />
      {loading ? (
        <Spin tip="Đang tải đơn hàng..." size="large" />
      ) : (
        <Table
          dataSource={filteredOrders}
          columns={columns}
          rowKey={(record) => record._id}
          pagination={false}
        />
      )}
    </Content>
  );
};

export default OrderManager;
