import axios from "axios";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/orders`;

// ✅ Lấy token từ localStorage (theo file Login.tsx bạn đã đưa)
const getAuthHeader = () => {
  const token = localStorage.getItem("token"); // sửa lại từ "accessToken" → "token"
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ✅ Lấy tất cả đơn hàng (admin)
export const getOrders = () =>
  axios.get(API_URL, getAuthHeader()).then((res) => res.data.data);

// ✅ Lấy đơn hàng theo ID
export const getOrderById = (id: string) =>
  axios.get(`${API_URL}/${id}`, getAuthHeader()).then((res) => res.data.data);

// ✅ Cập nhật trạng thái đơn hàng
export const updateOrder = (id: string, data: { status: string }) =>
  axios.put(`${API_URL}/${id}`, data, getAuthHeader()).then((res) => res.data);

// ✅ Xóa đơn hàng
export const deleteOrder = (id: string) =>
  axios.delete(`${API_URL}/${id}`, getAuthHeader()).then((res) => res.data);
