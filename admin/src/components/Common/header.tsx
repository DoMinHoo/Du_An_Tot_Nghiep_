import React from "react";
import { useNavigate } from "react-router-dom";
import { Input, Layout, Avatar, Dropdown, Menu } from "antd";
import {
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownOutlined,
} from "@ant-design/icons";

const { Header } = Layout;

const AdminHeader: React.FC = () => {
  const navigate = useNavigate();

  // Lấy user từ localStorage (nếu đã đăng nhập)
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const displayName = currentUser.name || "Admin";

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "3") {
      localStorage.removeItem("currentUser"); // Xóa thông tin đăng nhập
      navigate("/login");
    }
  };

  const menu = (
    <Menu
      onClick={handleMenuClick}
      items={[
    
        
        { type: "divider" },
        { key: "3", icon: <LogoutOutlined />, label: "Đăng xuất" },
      ]}
    />
  );

  return (
    <Header
      style={{
        background: "#fff",
        padding: "0 24px",
        height: 88,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 8px #f0f1f2",
      }}
    >
      <div style={{ width: 300 }}></div>
     
      <div style={{ width: 300, display: "flex", justifyContent: "flex-end", gap: 24 }}>
        <BellOutlined style={{ fontSize: 20, cursor: "pointer" }} />
        <Dropdown overlay={menu} placement="bottomRight">
          <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <Avatar style={{ backgroundColor: "#1890ff" }} icon={<UserOutlined />} />
            <span style={{ marginLeft: 8 }}>{displayName}</span>
            <DownOutlined style={{ fontSize: 12, marginLeft: 4 }} />
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default AdminHeader;
