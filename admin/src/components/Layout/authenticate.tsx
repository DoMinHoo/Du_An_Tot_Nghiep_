import React from "react";

type Props = {
    children: React.ReactNode;
    fallback: React.ReactNode;
};

const Authenticated = ({ children, fallback }: Props) => {
    // Lấy user từ localStorage (tuỳ bạn lưu thế nào)
    const userStr = localStorage.getItem("currentUser");
    let user: any = null;
    try {
        user = userStr ? JSON.parse(userStr) : null;
    } catch {
        user = null;
    }

    // Kiểm tra login và đúng role admin
    const isAuthenticated = !!user && user.role && user.role.trim().toLowerCase() === "admin";

    return <>{isAuthenticated ? children : fallback}</>;
};

export default Authenticated;
