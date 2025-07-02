import axios from 'axios';

const axiosInstance= axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  // ❌ GỠ withCredentials nếu không dùng cookie
});

// ✅ Gắn token từ localStorage vào Authorization Header
axiosInstance.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
export default axiosInstance;
