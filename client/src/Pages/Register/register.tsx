import React, { useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

interface RegisterFormValues {
  name: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  dateBirth: string;
  gender: 'male' | 'female' | 'other';
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormValues>({
    name: '',
    address: '',
    phone: '',
    email: '',
    password: '',
    dateBirth: '',
    gender: 'male',
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        dateBirth: dayjs(formData.dateBirth).format('YYYY-MM-DD'),
        roleId: '683734db6d5a889e406aa9ae',
      };

      await axios.post('http://localhost:5000/api/auth/register', payload);

      const storedUsers = JSON.parse(localStorage.getItem('userData') || '[]');
      const newId = storedUsers.length > 0 ? storedUsers[storedUsers.length - 1].id + 1 : 1;
      const newUser = {
        ...payload,
        id: newId,
        key: newId.toString(),
        status: 'active',
        role: 'Khách hàng',
      };
      storedUsers.push(newUser);
      localStorage.setItem('userData', JSON.stringify(storedUsers));

      alert('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Đăng ký thất bại!');
    }
    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="left-panel">
        <h2>Tạo tài khoản</h2>
        <p>Đăng ký tài khoản chỉ trong 1 phút để tích lũy điểm và nhận ưu đãi từ MOHO.</p>
      </div>
      <div className="right-panel">
        <form onSubmit={onFinish}>
          <input name="name" type="text" placeholder="Họ và tên" value={formData.name} onChange={handleChange} required />
          <input name="address" type="text" placeholder="Địa chỉ" value={formData.address} onChange={handleChange} required />
          <input name="phone" type="text" placeholder="Số điện thoại" value={formData.phone} onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Mật khẩu" value={formData.password} onChange={handleChange} required />
          <input name="dateBirth" type="date" value={formData.dateBirth} onChange={handleChange} required />

          <div className="gender-group">
            <label>
              <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={handleChange} />
              Nữ
            </label>
            <label>
              <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={handleChange} />
              Nam
            </label>
            <label>
              <input type="radio" name="gender" value="other" checked={formData.gender === 'other'} onChange={handleChange} />
              Khác
            </label>
          </div>

          <button type="submit" disabled={loading}>{loading ? 'Đang xử lý...' : 'Đăng ký'}</button>
        </form>

        {/* <div className="social-login">
          <button className="google">Đăng nhập Google</button>
          <button className="facebook">Đăng nhập Facebook</button>
        </div> */}

        <button className="back-button" onClick={() => navigate('/')}>← Quay lại trang chủ</button>
      </div>

      <style jsx>{`
        .register-container {
          display: flex;
          min-height: 100vh;
          font-family: sans-serif;
        }

        .left-panel {
          flex: 1;
          padding: 60px;
          background: #fff;
        }

        .left-panel h2 {
          font-size: 28px;
          margin-bottom: 12px;
        }

        .left-panel p {
          font-size: 14px;
          color: #555;
        }

        .right-panel {
          flex: 1;
          background: #f7f7f7;
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        form {
          display: flex;
          flex-direction: column;
        }

        input {
          margin-bottom: 16px;
          padding: 10px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .gender-group {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        button[type="submit"] {
          padding: 12px;
          background: black;
          color: white;
          border: none;
          cursor: pointer;
          border-radius: 4px;
          font-size: 16px;
        }

        .social-login {
          display: flex;
          gap: 10px;
          margin-top: 16px;
        }

        // .google {
        //   background: #ea4335;
        //   color: white;
        //   padding: 8px 12px;
        //   border: none;
        //   border-radius: 4px;
        // }

        // .facebook {
        //   background: #3b5998;
        //   color: white;
        //   padding: 8px 12px;
        //   border: none;
        //   border-radius: 4px;
        // }

        .back-button {
          background: none;
          border: none;
          margin-top: 20px;
          color: #444;
          cursor: pointer;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default Register;
