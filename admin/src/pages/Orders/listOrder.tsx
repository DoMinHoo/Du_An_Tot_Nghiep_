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
  Tag,
  Tooltip,
} from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { getOrders, deleteOrder } from "../../Services/orders.service";

const { Content } = Layout;

interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  street: string;
  province: string;
  district: string;
  ward: string;
  country: string;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface StatusEntry {
  status: string;
  changedAt: string;
  note?: string;
}

interface Order {
  _id: string;
  orderCode: string;
  totalAmount: number;
  status: string;
  shippingAddress: ShippingAddress;
  createdAt: string;
  items: OrderItem[];
  statusHistory: StatusEntry[];
  key?: number;
}

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
  canceled: "red",
};

const OrderManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State cho phân trang
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  useEffect(() => {
    fetchOrders();
  }, [page, limit, searchTerm]);

  useEffect(() => {
    if (location.state?.shouldRefresh) {
      fetchOrders();
    }
  }, [location.state]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: searchTerm,
      };

      const res = await getOrders(params); // getOrders hỗ trợ query {page, limit, search}
      setOrders(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, limit, totalPages: 1 });
    } catch (error) {
      message.error("Lỗi khi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, status: string) => {
    if (status !== "pending" && status !== "canceled") {
      message.warning("Chỉ có thể xóa đơn hàng khi đang chờ xác nhận hoặc đã hủy");
      return;
    }

    try {
      await deleteOrder(id);
      fetchOrders(); // Refresh lại trang hiện tại
      message.success("Đã xóa đơn hàng");
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "Lỗi khi xóa đơn hàng";
      message.error(errorMsg);
    }
  };

  const handleViewDetail = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const columns = [
    {
      title: "STT",
      render: (_: any, __: Order, index: number) =>
        (page - 1) * limit + index + 1,
    },
    {
      title: "Mã đơn hàng",
      dataIndex: "orderCode",
      key: "orderCode",
    },
    {
      title: "Khách hàng",
      key: "customer",
      render: (_: any, record: Order) => (
        <>
          <div>{record.shippingAddress.fullName}</div>
          <div>{record.shippingAddress.phone}</div>
          <div>{record.shippingAddress.email}</div>
        </>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) =>
        amount ? amount.toLocaleString("vi-VN") + "₫" : "N/A",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: Order) => {
        const reason =
          status === "canceled"
            ? record.statusHistory?.find((s) => s.status === "canceled")?.note
            : null;
        const tag = (
          <Tag color={statusColor[status] || "default"}>
            {statusText[status] || status}
          </Tag>
        );
        return status === "canceled" && reason ? (
          <Tooltip title={`Lý do huỷ: ${reason}`}>{tag}</Tooltip>
        ) : (
          tag
        );
      },
    },
    {
      title: "Địa chỉ giao hàng",
      dataIndex: "shippingAddress",
      key: "shippingAddress",
      render: (address: ShippingAddress) =>
        address?.addressLine && address?.street
          ? `${address.addressLine}, ${address.street}, ${address.ward}, ${address.district}, ${address.province}`
          : "N/A",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? new Date(date).toLocaleString("vi-VN") : "N/A",
    },
    {
      title: "Sản phẩm",
      dataIndex: "items",
      key: "items",
      render: (items: OrderItem[] = []) =>
        items.length > 0
          ? items.map((item, i) => (
            <div key={i}>
              {item.name} x{item.quantity}
              {item.price && item.price > 0
                ? ` – ${item.price.toLocaleString("vi-VN")}₫`
                : ""}
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
              {statusText[item.status] || item.status} (
              {item.changedAt
                ? new Date(item.changedAt).toLocaleString("vi-VN")
                : "N/A"}
              )
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
            onConfirm={() => handleDelete(record._id, record.status)}
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
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setPage(1); // reset về trang 1 khi search
        }}
        style={{ width: 300, marginBottom: 16 }}
      />
      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Spin tip="Đang tải đơn hàng..." size="large" />
          </div>
        ) : (
          <Table
            dataSource={orders}
            columns={columns}
            rowKey={(record) => record._id}
            pagination={{
              current: page,
              pageSize: limit,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50"],
              onChange: (newPage, newSize) => {
                setPage(newPage);
                setLimit(newSize || 10);
              },
            }}
          />
        )}
      </div>
    </Content>
  );
};

export default OrderManager;