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
        dataIndex: "changedAt",
        key: "changedAt",
        render: (date: string) => new Date(date).toLocaleString("vi-VN"),
    },
];

const statusMap: Record<string, string> = {
    pending: "Chưa thanh toán",
    shipping: "Đang xử lý",
    completed: "Đã thanh toán",
    canceled: "Đã hủy",
};

const reverseStatusMap: Record<string, string> = {
    "Chưa thanh toán": "pending",
    "Đang xử lý": "shipping",
    "Đã thanh toán": "completed",
    "Đã hủy": "canceled",
};

const OrderDetail: React.FC = () => {
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newStatus, setNewStatus] = useState("");

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/orders/${id}`);
                if (!res.ok) throw new Error("Không tìm thấy đơn hàng!");
                const data = await res.json();
                setOrder(data);
                setNewStatus(data.status);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    const handleOpenModal = () => {
        if (order) {
            setNewStatus(order.status);
            setIsModalVisible(true);
        }
    };

    const handleUpdateStatus = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/orders/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Lỗi khi cập nhật trạng thái");

            const updatedOrder = await res.json();
            setOrder(updatedOrder.order); // ✅ FIX: lấy order đúng từ object
            setIsModalVisible(false);
            message.success("Cập nhật trạng thái thành công!");
        } catch (err: any) {
            message.error(err.message);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "green";
            case "pending":
                return "red";
            case "canceled":
                return "volcano";
            case "shipping":
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
                    <Tag color={getStatusColor(order.status)}>{statusMap[order.status]}</Tag>
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
            <Table
                dataSource={order.items || []}
                columns={itemColumns}
                pagination={false}
                rowKey={(record: any) => record._id || record.name}
            />

            <h3 style={{ marginTop: 32 }}>Lịch sử trạng thái</h3>
            <Table
                dataSource={order.statusHistory || []}
                columns={statusHistoryColumns}
                pagination={false}
                rowKey={(record: any) => record.changedAt}
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
                    value={statusMap[newStatus] || newStatus}
                    style={{ width: "100%" }}
                    onChange={(value) => setNewStatus(reverseStatusMap[value])}
                >
                    {Object.entries(statusMap).map(([key, label]) => (
                        <Option key={key} value={label}>
                            {label}
                        </Option>
                    ))}
                </Select>
            </Modal>
        </Content>
    );
};

export default OrderDetail;
