import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SetUser: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userStr = params.get("user");
    const token = params.get("token");

    if (userStr && token) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        if (user.role?.toLowerCase() === "client") {
          localStorage.setItem("currentUser", JSON.stringify(user));
          localStorage.setItem("token", token);
        }
      } catch (err) {
        console.error("Lỗi khi parse user:", err);
      }
    }

    navigate("/"); // chuyển về trang chính sau khi set xong
  }, []);

  return <div>Đang xử lý đăng nhập...</div>;
};

export default SetUser;
