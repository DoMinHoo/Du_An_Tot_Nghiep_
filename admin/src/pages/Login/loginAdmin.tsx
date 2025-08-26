import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const logger = {
  info: (message: string) => console.info(message),
  warn: (message: string) => console.warn(message),
  error: (message: string, error: any) => console.error(message, error),
};

interface LoginFormValues {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormValues>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      setError('Vui lòng nhập email và mật khẩu');
      toast.error('Vui lòng nhập email và mật khẩu', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const guestId = sessionStorage.getItem('guestId') || '';

      const loginResponse = await fetch(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-guest-id': guestId,
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const loginData = await loginResponse.json();
      if (!loginResponse.ok || !loginData.success) {
        throw new Error(loginData.message || 'Đăng nhập thất bại');
      }

      const { user, token } = loginData.data || {};
      if (!user || !token) {
        throw new Error('Thông tin đăng nhập không hợp lệ');
      }

        const role = user?.roleId?.trim().toLowerCase();
if (role !== 'admin') {
  throw new Error('Chỉ tài khoản quản trị (admin) mới được đăng nhập');
}

      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('token', token);
      localStorage.removeItem('guestId');

      logger.info(`Đăng nhập thành công cho userId: ${user._id}`);

      if (guestId) {
        try {
          const mergeResponse = await fetch(
            'http://localhost:5000/api/carts/merge',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ guestId }),
            }
          );

          const cartResponse = await mergeResponse.json();
          if (!cartResponse.success) {
logger.warn(`Hợp nhất giỏ hàng thất bại: ${cartResponse.message}`);
            toast.warn(cartResponse.message || 'Không thể hợp nhất giỏ hàng', {
              position: 'top-right',
              autoClose: 3000,
            });
          } else {
            logger.info(`Hợp nhất giỏ hàng thành công cho userId ${user._id}`);
            toast.success(
              cartResponse.message || 'Hợp nhất giỏ hàng thành công',
              {
                position: 'top-right',
                autoClose: 1500,
              }
            );
          }
        } catch (error: any) {
          logger.error(`Lỗi hợp nhất giỏ hàng: ${error.message}`, error);
          toast.warn('Lỗi khi hợp nhất giỏ hàng', {
            position: 'top-right',
            autoClose: 3000,
          });
        }
      }

      toast.success('Đăng nhập thành công!', {
        position: 'top-right',
        autoClose: 1500,
      });

      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 1600);
    } catch (err: any) {
      const errorMessage =
        err.message || 'Đăng nhập thất bại. Vui lòng thử lại!';
      setError(errorMessage);
      logger.error(`Lỗi đăng nhập: ${errorMessage}`, err);
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }

          .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f3f4f6;
          }

          .login-box {
            background-color: #ffffff;
            padding: 2rem;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 28rem;
          }

          .title {
            font-size: 1.5rem;
            font-weight: bold;
            text-align: center;
            margin-bottom: 1rem;
          }

          .subtitle {
            text-align: center;
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 1.5rem;
          }

          .error-message {
            background-color: #fee2e2;
            color: #b91c1c;
            padding: 0.75rem;
            border-radius: 0.25rem;
            margin-bottom: 1rem;
            font-size: 0.875rem;
          }

          .form-group {
            margin-bottom: 1rem;
          }

          .input-field {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 0.25rem;
            font-size: 1rem;
            outline: none;
          }

          .input-field:focus {
            border-color: #3b82f6;
box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
          }

          .privacy-text {
            font-size: 0.75rem;
            color: #6b7280;
            margin-bottom: 1rem;
          }

          .privacy-text a {
            color: #2563eb;
            text-decoration: none;
          }

          .privacy-text a:hover {
            text-decoration: underline;
          }

          .login-button {
            width: 100%;
            padding: 0.75rem;
            background-color: #2563eb;
            color: #ffffff;
            border: none;
            border-radius: 0.25rem;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .login-button:hover:not(:disabled) {
            background-color: #1d4ed8;
          }

          .login-button:disabled {
            background-color: #9ca3af;
            cursor: not-allowed;
          }

          .links {
            margin-top: 1.5rem;
            text-align: center;
            font-size: 0.875rem;
          }

          .links p {
            margin: 0.5rem 0;
          }

          .links a {
            color: #2563eb;
            text-decoration: none;
          }

          .links a:hover {
            text-decoration: underline;
          }
        `}
      </style>
      <div className="login-container">
        <ToastContainer />
        <div className="login-box">
          <h2 className="title">ĐĂNG NHẬP TÀI KHOẢN</h2>
          <p className="subtitle">Nhập email và mật khẩu của bạn</p>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <input
              type="text"
              name="email"
              placeholder="Email hoặc số điện thoại"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              required
            />
          </div>
          <p className="privacy-text">
            Website được bảo vệ bởi reCAPTCHA và{' '}
            <a href="#">Chính sách bảo mật</a> và{' '}
            <a href="#">Điều khoản dịch vụ</a> của Google.
          </p>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
          </button>

          <div className="links">
            <p>
              Khách hàng mới? <a href="/signin">Tạo tài khoản</a>
            </p>
           
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;