import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Layout,
    Descriptions,
    Table,
    Tag,
    Button,
    Modal,
    Select,
    message,
    Spin,
    Alert,
} from "antd";

const { Content } = Layout;
const { Option } = Select;

const itemColumns = [
    {
        title: "Sản phẩm",
        dataIndex: "name",
        key: "name",
    },
    {
        title: "Số lượng",
        dataIndex: "quantity",
        key: "quantity",
    },
    {
        title: "Giá",
        dataIndex: "price",
        key: "price",
    },
];

const statusHistoryColumns = [
    {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
    },
    {
        title: "Thời gian",
        dataIndex: "date",
        key: "date",
        render: (date: string) => new Date(date).toLocaleString("vi-VN"),
    },
];

const OrderDetail: React.FC = () => {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newStatus, setNewStatus] = useState("");

    useEffect(() => {
        setLoading(true);
        setError(null);

        setTimeout(() => {
            if (id === "error") {
                setError("Không tìm thấy đơn hàng!");
                setLoading(false);
            } else {
                const fetchedOrder = {
                    id: id,
                    orderCode: `ORD00${id}`,
                    customerName: "Nguyễn Văn A",
                    status: "Chưa thanh toán",
                    createdAt: "2025-05-25T14:30:00Z",
                    totalAmount: 1500000,
                    shippingAddress: "123 Đường ABC, Quận 1, TP.HCM",
                    items: [
                        {
                            key: "1",
                            name: "Ghế gỗ cao cấp",
                            quantity: 2,
                            price: 500000,
                        },
                        {
                            key: "2",
                            name: "Bàn gỗ tròn",
                            quantity: 1,
                            price: 500000,
                        },
                    ],
                    statusHistory: [
                        { status: "Chưa thanh toán", date: "2025-05-25T14:30:00Z" },
                    ],
                };
                setOrder(fetchedOrder);
                setNewStatus(fetchedOrder.status);
                setLoading(false);
            }
        }, 1000);
    }, [id]);

    const handleOpenModal = () => {
        if (order) {
            setNewStatus(order.status);
            setIsModalVisible(true);
        }
    };

    const handleUpdateStatus = () => {
        if (order) {
            const updatedHistory = [
                ...order.statusHistory,
                { status: newStatus, date: new Date().toISOString() },
            ];
            setOrder({ ...order, status: newStatus, statusHistory: updatedHistory });
            setIsModalVisible(false);
            message.success("Cập nhật trạng thái thành công!");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Đã thanh toán":
                return "green";
            case "Chưa thanh toán":
                return "red";
            case "Đã hủy":
                return "volcano";
            case "Đang xử lý":
                return "blue";
            default:
                return "default";
        }
    };

    if (loading) {
        return (
            <Content style={{ margin: "24px", background: "#fff", padding: 24 }}>
                <Spin tip="Đang tải đơn hàng..." size="large" />
            </Content>
        );
    }

    if (error) {
        return (
            <Content style={{ margin: "24px", background: "#fff", padding: 24 }}>
                <Alert message="Lỗi" description={error} type="error" showIcon />
                <Button style={{ marginTop: 16 }} onClick={() => window.history.back()}>
                    Quay lại
                </Button>
            </Content>
        );
    }

    return (
        <Content style={{ margin: "24px", background: "#fff", padding: 24 }}>
            <h2>Chi tiết đơn hàng #{order.orderCode}</h2>

            <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
                <Descriptions.Item label="Khách hàng">{order.customerName}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                    <Tag color={getStatusColor(order.status)}>{order.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng tiền">
                    {order.totalAmount.toLocaleString("vi-VN")}₫
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ giao hàng">
                    {order.shippingAddress}
                </Descriptions.Item>
            </Descriptions>

            <Button type="primary" onClick={handleOpenModal} style={{ marginBottom: 16 }}>
                Cập nhật trạng thái
            </Button>

            <h3>Danh sách sản phẩm</h3>
            <Table dataSource={order.items} columns={itemColumns} pagination={false} rowKey="key" />

            <h3 style={{ marginTop: 32 }}>Lịch sử trạng thái</h3>
            <Table
                dataSource={order.statusHistory}
                columns={statusHistoryColumns}
                pagination={false}
                rowKey="date"
            />


            <Button style={{ marginTop: 24 }} onClick={() => window.history.back()}>
                Quay lại
            </Button>

            <Modal
                title="Cập nhật trạng thái đơn hàng"
                open={isModalVisible}
                onOk={handleUpdateStatus}
                onCancel={() => setIsModalVisible(false)}
                okText="Cập nhật"
                cancelText="Hủy"
            >
                <Select
                    value={newStatus}
                    style={{ width: "100%" }}
                    onChange={(value) => setNewStatus(value)}
                >
                    <Option value="Chưa thanh toán">Chưa thanh toán</Option>
                    <Option value="Đã thanh toán">Đã thanh toán</Option>
                    <Option value="Đã hủy">Đã hủy</Option>
                    <Option value="Đang xử lý">Đang xử lý</Option>
                </Select>
            </Modal>
        </Content>
    );
};

export default OrderDetail;
