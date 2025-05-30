import React from "react";
import { Layout, Button, Input, Table, Space, Popconfirm, type PopconfirmProps } from "antd";
import { useNavigate } from "react-router-dom";

const { Content } = Layout;

const dataSource = [
  {
    key: "1",
    _id: "orderid1",
    orderCode: "ORD001",
    customerName: "Nguyễn Văn A",
    totalAmount: 1500000,
    status: "Đã thanh toán",
    shippingAddress: "123 Đường ABC, Quận 1, TP.HCM",
    createdAt: "2024-05-01T10:00:00Z",
    items: [
      { name: "Sản phẩm A", quantity: 2 },
      { name: "Sản phẩm B", quantity: 1 },
    ],
    statusHistory: [
      { status: "Đã tạo", date: "2024-05-01T09:00:00Z" },
      { status: "Đã thanh toán", date: "2024-05-01T10:00:00Z" },
    ],
  },
  // Thêm dữ liệu mẫu khác nếu cần
  {
    key: "2",
    _id: "orderid2",
    orderCode: "ORD002",
    customerName: "Nguyễn Văn B",
    totalAmount: 1500000,
    status: "Đã thanh toán",
    shippingAddress: "123 Đường ABC, Quận 1, TP.HN",
    createdAt: "2024-05-01T10:00:00Z",
    items: [
      { name: "Sản phẩm A", quantity: 2 },
      { name: "Sản phẩm B", quantity: 1 },
    ],
    statusHistory: [
      { status: "Đã tạo", date: "2024-05-01T09:00:00Z" },
      { status: "Đã thanh toán", date: "2024-05-01T10:00:00Z" },
    ],
  },
];

const confirm: PopconfirmProps["onConfirm"] = (e) => {
  console.log("Xóa đơn hàng");
};

const cancel: PopconfirmProps["onCancel"] = (e) => {
  console.log("Hủy xóa");
};

const OrderManager: React.FC = () => {
  const navigate = useNavigate();

  const handleViewDetail = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

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
      render: (amount: number) => amount.toLocaleString("vi-VN") + "₫",
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
      render: (date: string) => new Date(date).toLocaleString("vi-VN"),
    },
    {
      title: "Sản phẩm",
      dataIndex: "items",
      key: "items",
      render: (items: any[]) => items.map((item, i) => (
        <div key={i}>{item.name} x{item.quantity}</div>
      )),
    },
    {
      title: "Lịch sử trạng thái",
      dataIndex: "statusHistory",
      key: "statusHistory",
      render: (history: any[]) => history.map((item, i) => (
        <div key={i}>
          {item.status} ({new Date(item.date).toLocaleString("vi-VN")})
        </div>
      )),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Button type="primary" onClick={() => handleViewDetail(record._id)}>Chi tiết</Button>
          <Popconfirm
            title="Xóa đơn hàng"
            description="Bạn có chắc muốn xóa đơn hàng này?"
            onConfirm={confirm}
            onCancel={cancel}
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
      <Input placeholder="Tìm kiếm đơn hàng..." style={{ width: 300, marginBottom: 16 }} />
      <Table dataSource={dataSource} columns={columns} pagination={false} />
    </Content>
  );
};

export default OrderManager;
