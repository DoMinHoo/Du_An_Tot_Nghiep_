import { Button, Result, Spin } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function CheckPayment() {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);

    const [status, setStatus] = useState<"success" | "error" | "info">("info");
    const [title, setTitle] = useState<string>("Đang xử lý kết quả thanh toán...");
    const [loading, setLoading] = useState<boolean>(true);

    const apptransid = searchParams.get("apptransid");
    const paymentStatus = searchParams.get("status");
    const zptransid = searchParams.get("zptransid");

    useEffect(() => {
        (async () => {
            if (!apptransid) {
                setStatus("error");
                setTitle("Không tìm thấy thông tin giao dịch");
                setLoading(false);
                return;
            }

            try {
                // Gửi về server để cập nhật trạng thái
                const { data } = await axios.post("http://localhost:5000/api/zalo-payment/return", {
                    apptransid,
                    status: paymentStatus,
                    zptransid
                });

                console.log("Return API response:", data);

                if (paymentStatus === "1") {
                    setStatus("success");
                    setTitle("Thanh toán thành công");
                } else {
                    setStatus("error");
                    setTitle("Thanh toán thất bại hoặc bị hủy");
                }
            } catch (error) {
                console.error("Error when calling return API:", error);
                setStatus("error");
                setTitle("Lỗi khi xử lý thanh toán");
            } finally {
                setLoading(false);
            }
        })();
    }, [apptransid, paymentStatus, zptransid]);

    if (loading) {
        return (
            <div style={{ textAlign: "center", paddingTop: "80px" }}>
                <Spin size="large" tip="Đang xử lý kết quả thanh toán..." />
            </div>
        );
    }

    return (
        <Result
            status={status}
            title={title}
            extra={[
                <Button type="primary" key="history" onClick={() => navigate("/order-history")}>
                    Lịch sử đơn hàng
                </Button>,
                <Button key="home" onClick={() => navigate("/")}>
                    Về trang chủ
                </Button>,
            ]}
        />
    );
}

export default CheckPayment;