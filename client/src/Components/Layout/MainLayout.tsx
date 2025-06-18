import React from "react";
import { Outlet } from "react-router-dom";
import HeaderClient from "../Common/Header";
import Footer from "../Common/Footer";
import BannerSlider from "../../Pages/Banner";

const MainLayout = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <HeaderClient />
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
