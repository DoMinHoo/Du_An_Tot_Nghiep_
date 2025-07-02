"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { createOrder } from "../services/orderService"
import Header from "../Components/Common/Header"
import Footer from "../Components/Common/Footer"
import { Card, Button, Result, Descriptions, Badge, Spin, Typography, Space, Row, Col, Alert, Table } from "antd"
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
} from "@ant-design/icons"

const { Title, Text } = Typography

const ReturnVnpayPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)

  const status = params.get("status")
  const amount = params.get("amount")
  const txnRef = params.get("txnRef")
  const transactionNo = params.get("transactionNo")
  const bankCode = params.get("bankCode")
  const paymentTime = params.get("paymentTime")
  const orderInfo = params.get("orderInfo")

  const [loading, setLoading] = useState(true)
  const [orderCreated, setOrderCreated] = useState(false)
  const [orderDetail, setOrderDetail] = useState<any>(null)

  useEffect(() => {
    if (status === "success") {
      const token = sessionStorage.getItem("token") || undefined
      const guestId = sessionStorage.getItem("guestId") || undefined
      const shippingAddress = sessionStorage.getItem("shippingAddress")
        ? JSON.parse(sessionStorage.getItem("shippingAddress") as string)
        : {}
      const cartId = sessionStorage.getItem("cartId") || ""

      // Lấy thông tin đơn hàng đã lưu khi tạo đơn (nếu có)
      const pendingOrder = sessionStorage.getItem("pendingOrder")
      if (pendingOrder) {
        setOrderDetail(JSON.parse(pendingOrder))
      }

      const orderData = {
        paymentMethod: "online_payment",
        vnp_TxnRef: txnRef,
        amount,
        shippingAddress,
        cartId,
      }

      createOrder(orderData, token, guestId)
        .then(() => {
          toast.success("Thanh toán thành công, đơn hàng đã được tạo")
          setOrderCreated(true)
          setLoading(false)
        })
        .catch(() => {
          toast.error("Lỗi tạo đơn sau khi thanh toán")
          setLoading(false)
        })
    } else {
      toast.error("Thanh toán thất bại")
      setLoading(false)
      setTimeout(() => navigate("/checkout"), 1500)
    }
    // eslint-disable-next-line
  }, [])

  if (loading) {
    return (
      <div>
        <Header />
        <div
          style={{
            minHeight: "60vh",
            background: "linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
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
    )
  }

  if (status !== "success") {
    return (
      <div>
        <Header />
        <div
          style={{
            minHeight: "60vh",
            background: "linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <Card style={{ width: "100%", maxWidth: 500 }}>
            <Result
              status="error"
              title="Thanh toán thất bại!"
              subTitle="Giao dịch không thể hoàn tất. Bạn sẽ được chuyển về trang thanh toán."
              icon={<CloseCircleOutlined style={{ color: "#ff4d4f" }} />}
              extra={[
                <Button type="primary" key="retry" onClick={() => navigate("/checkout")}>
                  Thử lại
                </Button>,
                <Button key="home" onClick={() => navigate("/")}>
                  Về trang chủ
                </Button>,
              ]}
            />
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  // Cột hiển thị sản phẩm
  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      key: "productName",
      render: (text: string) => <b>{text}</b>,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      key: "price",
      align: "right" as const,
      render: (price: number) => `${Number(price).toLocaleString()}₫`,
    },
    {
      title: "Thành tiền",
      key: "total",
      align: "right" as const,
      render: (_: any, record: any) => `${(record.price * record.quantity).toLocaleString()}₫`,
    },
  ]

  return (
    <div>
      <Header />

      {/* VNPay Header */}
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

      {/* Main Content */}
      <div
        style={{
          background: "linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%)",
          minHeight: "60vh",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Success Result */}
            <Card>
              <Result
                status="success"
                title="Thanh toán thành công!"
                subTitle="Giao dịch của bạn đã được xử lý thành công"
                icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              />
            </Card>

            {/* Transaction Details */}
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
                          <NumberOutlined />
                          <span>Mã giao dịch VNPay</span>
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
                          <NumberOutlined />
                          <span>Mã đơn hàng</span>
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
                          <DollarOutlined />
                          <span>Số tiền thanh toán</span>
                        </Space>
                      }
                    >
                      <Text strong style={{ color: "#52c41a", fontSize: 18 }}>
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
                          <BankOutlined />
                          <span>Ngân hàng</span>
                        </Space>
                      }
                    >
                      <Badge color="blue" text={bankCode} style={{ fontWeight: 500, fontSize: 14 }} />
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <Space>
                          <ClockCircleOutlined />
                          <span>Thời gian thanh toán</span>
                        </Space>
                      }
                    >
                      <Text strong>{new Date(paymentTime || "").toLocaleString("vi-VN")}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={
                        <Space>
                          <FileTextOutlined />
                          <span>Thông tin đơn hàng</span>
                        </Space>
                      }
                    >
                      <Text strong>{orderInfo}</Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Order Detail */}
            {orderDetail && orderDetail.items && orderDetail.items.length > 0 && (
              <Card
                title={
                  <Space>
                    <ShoppingOutlined style={{ color: "#1890ff" }} />
                    <span>Chi tiết đơn hàng</span>
                  </Space>
                }
                style={{ marginTop: 24 }}
              >
                <Table
                  dataSource={orderDetail.items.map((item: any, idx: number) => ({
                    ...item,
                    key: idx,
                  }))}
                  columns={columns}
                  pagination={false}
                  bordered
                  summary={pageData => {
                    const total = pageData.reduce((sum, row) => sum + row.price * row.quantity, 0)
                    return (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3} align="right">
                          <b>Tổng cộng</b>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <b>{total.toLocaleString()}₫</b>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )
                  }}
                />
              </Card>
            )}

            {/* Order Status */}
            {orderCreated && (
              <Alert
                message="Đơn hàng đã được tạo thành công"
                description="Bạn sẽ nhận được email xác nhận trong vài phút tới."
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                style={{ borderRadius: 8 }}
              />
            )}

            {/* Action Buttons */}
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

      {/* VNPay Footer */}
      <div
        style={{
          background: "#fff",
          borderTop: "1px solid #f0f0f0",
          padding: "24px 0",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center" }}>
            <Text type="secondary">© 2024 VNPay. Cổng thanh toán điện tử hàng đầu Việt Nam</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Hotline: 1900 555 577 | Email: support@vnpay.vn
            </Text>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default ReturnVnpayPage
