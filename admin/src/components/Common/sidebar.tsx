import React from "react";
import { Menu } from "antd";
import {
  AppstoreOutlined,
  ShoppingOutlined,
  UnorderedListOutlined,
  ProfileOutlined,
  UserOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import logo from "./img/image 15.png";

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const selectedKey = location.pathname.split("/")[2] || "dashboard";

  const menuItems = [
    {
      key: "dashboard",
      icon: <AppstoreOutlined />,
      label: <Link to="dashboard">Tổng quan</Link>,
    },
    {
      key: "products",
      icon: <ShoppingOutlined />,
      label: <Link to="products">Sản phẩm</Link>,
    },
    {
      key: "categories",
      icon: <UnorderedListOutlined />,
      label: <Link to="categories">Danh mục</Link>,
    },
    {
      key: "orders",
      icon: <ProfileOutlined />,
      label: <Link to="orders">Đơn hàng</Link>,
    },
    {
      key: "users",
      icon: <UserOutlined />,
      label: <Link to="users">Người dùng</Link>,
    },
    {
      key: "promotions",
      icon: <GiftOutlined />,
      label: <Link to="promotions">Khuyến mãi</Link>,
    },
    {
      key: "comment-review",

      icon: <ProfileOutlined />,
      label: <Link to="comment&review">Đánh giá</Link>,
    },
    {
      key: "banners",
      icon: <ProfileOutlined />,
      label: <Link to="banners">Banner</Link>,
    },
    {
      key: "materials",
      icon: <ProfileOutlined />,
      label: <Link to="materials">Materials</Link>,
    },
  ];

  return (
    <div
      style={{
        height: "100%",
        background: "#f9f6f1",
        padding: "16px 0",
        borderRight: "1px solid #e6dfd3",
        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.04)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "0 24px",
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        <Link to="/admin">
          <img
            src={logo}
            alt="Logo"
            style={{
              maxWidth: "150px",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
              borderRadius: "8px",
            }}
          />
        </Link>
      </div>

      {/* Menu */}
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        style={{
          background: "transparent",
          borderRight: "none",
          fontSize: 16,
          padding: "0 12px",
        }}
        items={menuItems.map((item) => ({
          ...item,
          label: (
            <div
              style={{
                color: selectedKey === item.key ? "#c8a97e" : "#333",
                fontWeight: selectedKey === item.key ? 600 : 500,
              }}
            >
              {item.label}
            </div>
          ),
        }))}
      />
    </div>
  );
};

export default AdminSidebar;
