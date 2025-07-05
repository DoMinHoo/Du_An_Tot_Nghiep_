import React, { useEffect, useState } from "react";
import { message, Spin } from "antd";

const UserAccount: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<"info" | "password">("info");

  useEffect(() => {
    const stored = sessionStorage.getItem("currentUser");
    if (stored) {
      const userData = JSON.parse(stored);
      setUser(userData);
      setFormData(userData);
    }
    setLoading(false);
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/users/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setUser(data.user);
      sessionStorage.setItem("currentUser", JSON.stringify(data.user));
      message.success("Cập nhật thành công");
      setEditing(false);
    } catch (err: any) {
      message.error(`Lỗi: ${err.message}`);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spin size="large" /></div>;
  if (!user) return <div className="text-center py-10">Vui lòng đăng nhập.</div>;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold text-center mb-8 text-blue-700">Tài khoản của bạn</h2>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          className={`pb-2 px-3 font-medium ${tab === "info" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          onClick={() => setTab("info")}
        >
          Thông tin cá nhân
        </button>
        <button
          className={`pb-2 px-3 font-medium ${tab === "password" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`}
          onClick={() => setTab("password")}
        >
          Đổi mật khẩu
        </button>
      </div>

      {/* Nội dung tab */}
      {tab === "info" ? (
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
          {editing ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="name" placeholder="Họ tên" value={formData.name} onChange={handleChange}
                  className="border px-3 py-2 rounded-md" />
                <input name="email" value={formData.email} readOnly className="border px-3 py-2 rounded-md bg-gray-100" />
                <input name="phone" placeholder="Số điện thoại" value={formData.phone || ''} onChange={handleChange}
                  className="border px-3 py-2 rounded-md" />
                <input name="address" placeholder="Địa chỉ" value={formData.address || ''} onChange={handleChange}
                  className="border px-3 py-2 rounded-md" />
                <input name="dateBirth" type="date" value={formData.dateBirth?.slice(0, 10)} onChange={handleChange}
                  className="border px-3 py-2 rounded-md" />
                <select name="gender" value={formData.gender || ""} onChange={handleChange}
                  className="border px-3 py-2 rounded-md">
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className="text-right mt-4 space-x-2">
              <button
  onClick={handleUpdate}
  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
>
  Lưu
</button>

                <button onClick={() => setEditing(false)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Hủy</button>
              </div>
            </>
          ) : (
            <>
              <p><strong>Họ tên:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>SĐT:</strong> {user.phone || "Chưa có"}</p>
              <p><strong>Địa chỉ:</strong> {user.address || "Chưa có"}</p>
              <p><strong>Ngày sinh:</strong> {user.dateBirth?.slice(0, 10) || "Chưa có"}</p>
              <p><strong>Giới tính:</strong> {user.gender || "Chưa có"}</p>
              <div className="text-right pt-4">
                <button onClick={() => setEditing(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Chỉnh sửa
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6">
          <p className="text-gray-600">Chức năng đổi mật khẩu sẽ được thêm ở đây.</p>
        </div>
      )}
    </div>
  );
};

export default UserAccount;
