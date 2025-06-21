import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Logger cho client-side
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
    setError(null); // Xóa lỗi khi người dùng nhập lại
  };

  const handleLogin = async () => {
    // Kiểm tra đầu vào
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
      // Lấy guestId từ localStorage
      const guestId = localStorage.getItem('guestId') || '';

      // Gửi yêu cầu đăng nhập
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
      if (!loginResponse.ok) {
        throw new Error(loginData.message || 'Đăng nhập thất bại');
      }

      const { user, token } = loginData.data || {};
      if (!user || !token) {
        throw new Error('Thông tin đăng nhập không hợp lệ');
      }

      // Lưu thông tin người dùng và token
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('token', token);
      logger.info(`Đăng nhập thành công cho userId: ${user._id}`);

      // Hợp nhất giỏ hàng nếu có guestId
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
            logger.warn(
              `Hợp nhất giỏ hàng thất bại cho userId ${user._id}, guestId ${guestId}: ${cartResponse.message}`
            );
            toast.warn(
              cartResponse.message ||
                'Không thể hợp nhất giỏ hàng, sử dụng giỏ hàng người dùng',
              {
                position: 'top-right',
                autoClose: 3000,
              }
            );
          } else {
            logger.info(
              `Hợp nhất giỏ hàng thành công cho userId ${user._id}, guestId ${guestId}`
            );
            toast.success(
              cartResponse.message || 'Hợp nhất giỏ hàng thành công',
              {
                position: 'top-right',
                autoClose: 1500,
              }
            );
          }
        } catch (error: any) {
          logger.error(
            `Lỗi hợp nhất giỏ hàng cho userId ${user._id}, guestId ${guestId}`,
            error
          );
          toast.warn('Lỗi khi hợp nhất giỏ hàng, sử dụng giỏ hàng người dùng', {
            position: 'top-right',
            autoClose: 3000,
          });
        } finally {
          // Xóa guestId sau khi hợp nhất
          localStorage.removeItem('guestId');
        }
      }

      // Hiển thị thông báo đăng nhập thành công
      toast.success('Đăng nhập thành công!', {
        position: 'top-right',
        autoClose: 1500,
      });

      // Điều hướng dựa trên vai trò
      const role = user?.role?.trim().toLowerCase();
      setTimeout(() => {
        if (role === 'admin') {
          navigate('/admin/dashboard'); // Sử dụng navigate thay vì window.location
        } else {
          navigate('/');
        }
      }, 1500);
    } catch (err: any) {
      const errorMessage =
        err.message || 'Đăng nhập thất bại. Vui lòng thử lại!';
      setError(errorMessage);
      logger.error(
        `Lỗi đăng nhập cho email ${formData.email}: ${errorMessage}`,
        err
      );
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <ToastContainer />
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-4">
          ĐĂNG NHẬP TÀI KHOẢN
        </h2>
        <p className="text-center text-sm text-gray-600 mb-6">
          Nhập email và mật khẩu của bạn
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            name="email"
            placeholder="Email hoặc số điện thoại"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Mật khẩu"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500">
            Website được bảo vệ bởi reCAPTCHA và{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Chính sách bảo mật
            </a>{' '}
            và{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Điều khoản dịch vụ
            </a>{' '}
            của Google.
          </p>
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full p-3 text-white rounded font-medium ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm">
          <p>
            Khách hàng mới?{' '}
            <a href="/signin" className="text-blue-600 hover:underline">
              Tạo tài khoản
            </a>
          </p>
          <p>
            Quên mật khẩu?{' '}
            <a href="/forgot" className="text-blue-600 hover:underline">
              Khôi phục mật khẩu
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
