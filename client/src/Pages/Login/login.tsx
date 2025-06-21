import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface LoginFormValues {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<LoginFormValues>({
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Lấy guestId từ localStorage
      const guestId = localStorage.getItem('guestId');

      // Gửi guestId trong request đăng nhập
      const res = await axios.post(
        'http://localhost:5000/api/auth/login',
        { ...formData, guestId } // Thêm guestId vào body
      );

      const user = res.data?.data?.user;
      const token = res.data?.data?.token;
      const role = user?.role?.trim().toLowerCase();
      const cart = res.data?.data?.cart;

      if (!user || !role) {
        toast.error('Thông tin tài khoản không hợp lệ!');
        setLoading(false);
        return;
      }

      // Lưu user & token
      localStorage.setItem('currentUser', JSON.stringify(user));
      if (token) {
        localStorage.setItem('token', token);
      }

      // Xóa guestId khỏi localStorage nếu có
      if (guestId) {
        localStorage.removeItem('guestId');
      }

      // Hiển thị thông báo thành công
      toast.success(cart?.message || 'Đăng nhập thành công!', {
        autoClose: 1000,
      });

      if (role === 'admin') {
        setTimeout(() => {
          window.location.href = 'http://localhost:5174/admin/dashboard';
        }, 1000);
      } else {
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Đăng nhập thất bại!', {
        autoClose: 1000,
      });
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <form className="login-form" onSubmit={onFinish}>
        <h2>ĐĂNG NHẬP TÀI KHOẢN</h2>
        <p>Nhập email và mật khẩu của bạn:</p>

        <input
          type="text"
          name="email"
          placeholder="Nhập email hoặc số điện thoại"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Mật khẩu"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <p className="recaptcha-text">
          Website được bảo vệ bởi reCAPTCHA và{' '}
          <a href="#">Chính sách bảo mật</a> và{' '}
          <a href="#">Điều khoản dịch vụ</a> của Google.
        </p>

        <button type="submit" disabled={loading}>
          {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
        </button>

        <div className="form-footer">
          <p>
            Khách hàng mới? <a href="/signin">Tạo tài khoản</a>
          </p>
          <p>
            Quên mật khẩu? <a href="/forgot">Khôi phục mật khẩu</a>
          </p>
        </div>
      </form>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #f7f7f7;
        }

        .login-form {
          width: 400px;
          background: white;
          padding: 32px;
          border-radius: 8px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
          font-family: sans-serif;
        }

        .login-form h2 {
          text-align: center;
          font-size: 22px;
          margin-bottom: 8px;
        }

        .login-form p {
          text-align: center;
          font-size: 14px;
          margin-bottom: 16px;
          color: #333;
        }

        input {
          width: 100%;
          padding: 12px;
          margin-bottom: 14px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .recaptcha-text {
          font-size: 12px;
          color: #666;
          margin-bottom: 16px;
          text-align: left;
        }

        .recaptcha-text a {
          color: #1a73e8;
          text-decoration: none;
        }

        button {
          width: 100%;
          padding: 12px;
          background: #555;
          color: white;
          font-size: 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .form-footer {
          margin-top: 16px;
          text-align: center;
          font-size: 14px;
        }

        .form-footer a {
          color: #1a73e8;
          text-decoration: none;
        }

        .form-footer a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default Login;
