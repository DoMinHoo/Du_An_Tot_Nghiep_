import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }: any) => {
    const isLoggedIn = !!localStorage.getItem("token"); // hoặc dùng context/auth state
    return isLoggedIn ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;