import React from "react";
import { Layout, Button, Input, Table, Space, Popconfirm, type PopconfirmProps } from "antd";
import { useNavigate } from "react-router-dom"; // ✅ Thêm hook này

const { Content } = Layout;

// Dữ liệu mẫu đơn hàng
const dataSource = [
  {
    key: "1",
    orderCode: "ORD001",
    customerName: "Nguyễn Văn A",
    totalAmount: "1,500,000₫",
    status: "Đã thanh toán",
  },
  {
    key: "2",
    orderCode: "ORD002",
    customerName: "Trần Thị B",
    totalAmount: "750,000₫",
    status: "Chưa thanh toán",
  },
];

// Hàm xác nhận/xoá
const confirm: PopconfirmProps["onConfirm"] = (e) => {
  console.log("Xóa đơn hàng");
};

const cancel: PopconfirmProps["onCancel"] = (e) => {
  console.log("Hủy xóa");
};

const OrderManager: React.FC = () => {
  const navigate = useNavigate(); // ✅ Dùng để điều hướng

  const handleViewDetail = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`); // ✅ Điều hướng đến trang chi tiết
  };

  // ✅ Cập nhật lại phần columns để sử dụng record
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
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Button type="primary" onClick={() => handleViewDetail(record.key)}>Chi tiết</Button>
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
