"use client";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Card,
  Button,
  Result,
  Descriptions,
  Badge,
  Spin,
  Typography,
  Space,
  Row,
  Col,
  Alert,
  Table,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  HomeOutlined,
  CreditCardOutlined,
  BankOutlined,
  ClockCircleOutlined,
  NumberOutlined,
  DollarOutlined,
  FileTextOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import Header from "../Components/Common/Header";
import Footer from "../Components/Common/Footer";

const { Title, Text } = Typography;

// Hàm gọi API để lấy thông tin đơn hàng
const fetchOrder = async (orderCode: string, token?: string, guestId?: string) => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const query = guestId ? `?guestId=${guestId}` : "";
  const response = await fetch(
    `http://localhost:5000/api/vnpay/orders/${orderCode}${query}`,
    { headers }
  );
  if (!response.ok) throw new Error("Không thể lấy thông tin đơn hàng");
  return response.json();
};

const ReturnVnpayPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  const status = params.get("status");
  const amount = params.get("amount");
  const txnRef = params.get("txnRef"); // orderCode
  const transactionNo = params.get("transactionNo");
  const bankCode = params.get("bankCode");
  const paymentTime = params.get("paymentTime");
  const orderInfo = params.get("orderInfo");

  const [loading, setLoading] = useState(true);
  const [orderDetail, setOrderDetail] = useState<any>(null);

  const token = sessionStorage.getItem("token") || undefined;
  const guestId = sessionStorage.getItem("guestId") || undefined;

  useEffect(() => {
    if (!txnRef) {
      toast.error("Không tìm thấy mã đơn hàng");
      setLoading(false);
      setTimeout(() => navigate("/checkout"), 1500);
      return;
    }

    if (status === "success") {
      // Gọi API để lấy thông tin đơn hàng mới nhất
      fetchOrder(txnRef, token, guestId)
        .then((order) => {
          setOrderDetail(order);
          toast.success("Thanh toán thành công, đơn hàng đã được cập nhật!");
          // Xóa sessionStorage sau khi thanh toán thành công
          sessionStorage.removeItem("pendingOrder");
          sessionStorage.removeItem("cartId");
          sessionStorage.removeItem("shippingAddress");
          setLoading(false);
        })
        .catch((error) => {
          toast.error("Lỗi khi lấy thông tin đơn hàng: " + error.message);
          setLoading(false);
        });
    } else {
      // Lấy thông tin đơn hàng để hiển thị trạng thái thất bại
      fetchOrder(txnRef, token, guestId)
        .then((order) => {
          setOrderDetail(order);
          toast.error(params.get("message") || "Thanh toán thất bại");
          setLoading(false);
        })
        .catch(() => {
          toast.error(params.get("message") || "Thanh toán thất bại");
          setLoading(false);
          setTimeout(() => navigate("/checkout"), 1500);
        });
    }
  }, [txnRef, status, token, guestId, navigate]);

  if (loading) {
    return (
      <div>
        <Header />
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)",
          }}
        >
          <Card style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Spin size="large" />
              <div>
                <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
                  Đang xử lý kết quả thanh toán
                </Title>
                <Text type="secondary">Vui lòng chờ trong giây lát...</Text>
              </div>
            </Space>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (status !== "success") {
    return (
      <div>
        <Header />
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)",
          }}
        >
          <Card style={{ width: "100%", maxWidth: 500 }}>
            <Result
              status="error"
              title="Thanh toán thất bại!"
              subTitle={params.get("message") || "Giao dịch không thể hoàn tất."}
              icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
              extra={[
                <Button
                  type="primary"
                  key="retry"
                  onClick={() => navigate("/checkout")}
                >
                  Thử lại
                </Button>,
                <Button key="home" onClick={() => navigate("/")}>
                  Về trang chủ
                </Button>,
              ]}
            />
            {orderDetail && (
              <Card style={{ marginTop: 16 }}>
                <Descriptions title="Thông tin đơn hàng" column={1}>
                  <Descriptions.Item label="Mã đơn hàng">
                    <Text strong>{orderDetail.orderCode}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái thanh toán">
                    <Badge
                      status="error"
                      text={orderDetail.paymentStatus === "failed" ? "Thất bại" : "Chưa thanh toán"}
                    />
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      key: "productName",
      render: (_: any, record: any) => (
        <b>{record.variationId?.name || "Sản phẩm"}</b>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
    },
    {
      title: "Đơn giá",
      dataIndex: "salePrice",
      key: "price",
      align: "right",
      render: (price: number) => `${Number(price).toLocaleString()}₫`,
    },
    {
      title: "Thành tiền",
      key: "total",
      align: "right",
      render: (_: any, record: any) =>
        `${(record.salePrice * record.quantity).toLocaleString()}₫`,
    },
  ];

  return (
    <div>
      <Header />
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "16px 24px" }}>
          <Space align="center">
            <div
              style={{
                width: 40,
                height: 40,
                background: "#1890ff",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CreditCardOutlined style={{ color: "#fff", fontSize: 20 }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
                VNPay
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Cổng thanh toán điện tử
              </Text>
            </div>
          </Space>
        </div>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)",
          minHeight: "60vh",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card>
              <Result
                status="success"
                title="Thanh toán thành công!"
                subTitle="Giao dịch của bạn đã được xử lý thành công."
                icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              />
            </Card>

            <Card
              title={
                <Space>
                  <FileTextOutlined style={{ color: "#1890ff" }} />
                  <span>Thông tin giao dịch</span>
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Descriptions column={1} size="middle">
                    <Descriptions.Item
                      label={
                        <Space>
                          <NumberOutlined /> Mã giao dịch VNPay
                        </Space>
                      }
                    >
                      <Text strong copyable style={{ color: "#1890ff" }}>
                        {transactionNo}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <Space>
                          <NumberOutlined /> Mã đơn hàng
                        </Space>
                      }
                    >
                      <Text strong copyable style={{ color: "#1890ff" }}>
                        {txnRef}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <Space>
                          <DollarOutlined /> Số tiền thanh toán
                        </Space>
                      }
                    >
                      <Text
                        strong
                        style={{ color: "#52c41a", fontSize: 18 }}
                      >
                        {Number(amount).toLocaleString()}₫
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={24} md={12}>
                  <Descriptions column={1} size="middle">
                    <Descriptions.Item
                      label={
                        <Space>
                          <BankOutlined /> Ngân hàng
                        </Space>
                      }
                    >
                      <Badge
                        color="blue"
                        text={bankCode}
                        style={{ fontWeight: 500, fontSize: 14 }}
                      />
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <Space>
                          <ClockCircleOutlined /> Thời gian thanh toán
                        </Space>
                      }
                    >
                      <Text strong>
                        {new Date(paymentTime || "").toLocaleString("vi-VN")}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <Space>
                          <FileTextOutlined /> Thông tin đơn hàng
                        </Space>
                      }
                    >
                      <Text strong>{orderInfo}</Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* {orderDetail?.items?.length > 0 && (
              <Card
                title={
                  <Space>
                    <ShoppingOutlined style={{ color: "#1890ff" }} />
                    <span>Chi tiết đơn hàng</span>
                  </Space>
                }
              >
                <Descriptions column={1} size="middle" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="Trạng thái thanh toán">
                    <Badge
                      status={orderDetail.paymentStatus === "completed" ? "success" : "error"}
                      text={orderDetail.paymentStatus === "completed" ? "Đã thanh toán" : "Chưa thanh toán"}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ giao hàng">
                    <Text>
                      {orderDetail.shippingAddress
                        ? `${orderDetail.shippingAddress.fullName}, ${orderDetail.shippingAddress.addressLine}, ${orderDetail.shippingAddress.street}, ${orderDetail.shippingAddress.ward}, ${orderDetail.shippingAddress.district}, ${orderDetail.shippingAddress.province}`
                        : "N/A"}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
                <Table
                  dataSource={orderDetail.items.map((item: any, idx: number) => ({
                    key: idx,
                    productName: item.variationId?.name,
                    quantity: item.quantity,
                    salePrice: item.salePrice,
                  }))}
                  columns={columns}
                  pagination={false}
                  bordered
                  summary={(pageData) => {
                    const total = pageData.reduce(
                      (sum, row) => sum + row.salePrice * row.quantity,
                      0
                    );
                    return (
                      <Table.Summary.Row>
                        <Table.Summary.Cell colSpan={3} align="right">
                          <b>Tổng cộng</b>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell align="right">
                          <b>{total.toLocaleString()}₫</b>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    );
                  }}
                />
              </Card>
            )} */}

            <Card>
              <div style={{ textAlign: "center" }}>
                <Space size="middle" wrap>
                  <Button
                    type="primary"
                    size="large"
                    icon={<HomeOutlined />}
                    onClick={() => navigate("/")}
                    style={{ minWidth: 140, height: 45 }}
                  >
                    Về trang chủ
                  </Button>
                  <Button
                    size="large"
                    icon={<ShoppingOutlined />}
                    onClick={() => navigate("/order-history")}
                    style={{ minWidth: 140, height: 45 }}
                  >
                    Xem đơn hàng
                  </Button>
                </Space>
              </div>
            </Card>
          </Space>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          borderTop: "1px solid #f0f0f0",
          padding: "24px 0",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          <Text type="secondary">
            © 2024 VNPay. Cổng thanh toán điện tử hàng đầu Việt Nam
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Hotline: 1900 555 577 | Email: support@vnpay.vn
          </Text>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ReturnVnpayPage;