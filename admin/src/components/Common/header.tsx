import React from "react";
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
  const menu = (
    <Menu
      items={[
        { key: "1", icon: <UserOutlined />, label: "Thông tin cá nhân" },
        { key: "2", icon: <SettingOutlined />, label: "Cài đặt" },
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
      {/* Left side (empty or logo) */}
      <div style={{ width: 300 }}></div>

      {/* Center (Search) */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <Input.Search
          placeholder="Tìm kiếm..."
          style={{ width: 400 }}
          allowClear
        />
      </div>

      {/* Right side (Notification & User) */}
      <div style={{ width: 300, display: "flex", justifyContent: "flex-end", gap: 24 }}>
        <BellOutlined style={{ fontSize: 20, cursor: "pointer" }} />
        <Dropdown overlay={menu} placement="bottomRight">
          <div
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          >
            <Avatar style={{ backgroundColor: "#1890ff" }} icon={<UserOutlined />} />
            <span style={{ marginLeft: 8 }}>Admin</span>
            <DownOutlined style={{ fontSize: 12, marginLeft: 4 }} />
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default AdminHeader;
