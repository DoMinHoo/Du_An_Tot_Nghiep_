import React from "react";
import { Input, Layout } from "antd";

const { Header } = Layout;

const AdminHeader: React.FC = () => {
  return (
    <Header
      style={{
        background: "#fff",
        padding: "25px 24px",
        height:"88px",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <Input.Search placeholder="Tìm kiếm ..." style={{ width: 300 }} />
      <div>Xin chào, Admin 🔴</div>
    </Header>
  );
};

export default AdminHeader;
