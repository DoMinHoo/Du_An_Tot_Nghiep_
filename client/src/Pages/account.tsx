import React, { useEffect, useState } from "react";
import { message, Spin } from "antd";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBirthdayCake, FaTransgenderAlt } from "react-icons/fa";

const UserAccount: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Lấy thông tin người dùng từ localStorage
    const storedUser = localStorage.getItem("currentUser");
    const userData = JSON.parse(localStorage.getItem("userData") || "[]"); // Đọc từ userData

    console.log("Stored User:", storedUser);  // Kiểm tra dữ liệu người dùng đã lưu
    console.log("User Data:", userData); // Kiểm tra mảng userData

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const selectedUser = userData.find((user: any) => user.email === parsedUser.email); // Lấy người dùng theo email
        console.log("Selected User:", selectedUser); // Kiểm tra người dùng được chọn
        setUser(selectedUser); // Lưu đối tượng người dùng được chọn vào state
      } catch (error) {
        console.log("Error parsing user:", error);
        setUser(null);
        message.error("Không thể lấy thông tin người dùng");
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <Spin size="large" />;
  }

  // Nếu không có thông tin người dùng
  if (!user) {
    return <div>Thông tin người dùng không có sẵn. Vui lòng đăng nhập.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6">Thông tin tài khoản</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-4">
          <FaUser className="text-3xl mr-4" />
          <h3 className="text-xl font-medium">{user.name}</h3>
        </div>
        <div className="flex items-center mb-4">
          <FaEnvelope className="text-xl mr-4" />
          <p>{user.email}</p>
        </div>
        <div className="flex items-center mb-4">
          <FaPhone className="text-xl mr-4" />
          <p>{user.phone ? user.phone : "Chưa có số điện thoại"}</p>  {/* Kiểm tra giá trị phone */}
        </div>
        <div className="flex items-center mb-4">
          <FaMapMarkerAlt className="text-xl mr-4" />
          <p>{user.address ? user.address : "Chưa có địa chỉ"}</p>  {/* Kiểm tra giá trị address */}
        </div>
        <div className="flex items-center mb-4">
          <FaBirthdayCake className="text-xl mr-4" />
          <p>{user.dateBirth ? user.dateBirth : "Chưa có ngày sinh"}</p>  {/* Kiểm tra giá trị dateBirth */}
        </div>
        <div className="flex items-center mb-4">
          <FaTransgenderAlt className="text-xl mr-4" />
          <p>Giới tính: {user.gender ? (user.gender === "male" ? "Nam" : user.gender === "female" ? "Nữ" : "Khác") : "Chưa có giới tính"}</p>
          {/* Kiểm tra giá trị gender và hiển thị */}
        </div>
      </div>
    </div>
  );
};

export default UserAccount;
