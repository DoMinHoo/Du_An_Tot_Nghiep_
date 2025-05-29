import React from "react";
import { Layout, Menu } from "antd";
import {
    AppstoreOutlined,
    ShoppingOutlined,
    UnorderedListOutlined,
    ProfileOutlined,
    UserOutlined,
    GiftOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import logo from "./img/image 15.png"

const { Sider } = Layout;

const AdminSidebar: React.FC = () => {
    return (
        <Sider width={200} className="site-layout-background">
            <div
                className="logo"
                style={{
                    background: 'white',
                    padding: "16px",
                    textAlign: "center",
                }}
            >
                <Link to="/admin">
                    <img
                        src={logo}
                        alt="Admin Logo"
                        style={{ maxWidth: "100%", height: "auto" }}
                    />
                </Link>
            </div>

            <Menu
                mode="inline"
                defaultSelectedKeys={["3"]}
                style={{ height: "100%" }}
                items={[
                    { key: "1", icon: <AppstoreOutlined />, label: <Link to="/dashboard">Tổng quan</Link> },
                    { key: "2", icon: <ShoppingOutlined />, label: <Link to="/products">Sản phẩm</Link> },
                    { key: "3", icon: <UnorderedListOutlined />, label: <Link to="/admin/cate">Danh mục</Link> },
                    { key: "4", icon: <ProfileOutlined />, label: <Link to="/orders">Đơn hàng</Link> },
                    { key: "5", icon: <UserOutlined />, label: <Link to="/users">Người dùng</Link> },
                    { key: "6", icon: <GiftOutlined />, label: <Link to="/promotions">Khuyến mãi</Link> },
                    { key: "7", icon: <ProfileOutlined />, label: <Link to="/admin/review">Bình luận & Đánh giá</Link> }, // <-- mục mới
                ]}

            />
        </Sider>
    );
};

export default AdminSidebar;
