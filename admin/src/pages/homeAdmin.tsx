import React from "react";
import { Layout, Card, Row, Col } from "antd";
import AdminSidebar from "../components/sidebar";
import AdminHeader from "../components/header";

const { Content } = Layout;

const Dashboard: React.FC = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSidebar />
      <Layout>
        <AdminHeader />
        <Content style={{ margin: "24px", background: "#fff", padding: 24 }}>
          <h2 style={{ marginBottom: 24 }}>Tổng quan hệ thống</h2>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card title="Sản phẩm" bordered={false}>
                120 sản phẩm
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card title="Đơn hàng" bordered={false}>
                58 đơn hàng mới
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card title="Người dùng" bordered={false}>
                230 khách hàng
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard;
