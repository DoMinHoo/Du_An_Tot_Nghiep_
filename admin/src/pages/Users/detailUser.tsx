import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, Col, Row, message, Spin } from 'antd';
import dayjs from 'dayjs';

interface Role {
  name: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  address: string;
  dateBirth: string;
  status: string;
  roleId: Role;
  gender: string;
  phone: string;
}

const UserDetail: React.FC = () => {
  const { id } = useParams(); // Lấy ID người dùng từ URL
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/users/${id}`);
        setUser(res.data);
      } catch (err: any) {
        message.error('Không thể tải thông tin người dùng');
        navigate('/'); // Quay lại trang danh sách nếu không thể lấy thông tin
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUserDetail();
  }, [id, navigate]);

  if (loading) return <Spin size="large" />;

  if (!user) return <div>Không tìm thấy người dùng.</div>;

  return (
    <div>
      <h2>Thông tin chi tiết người dùng</h2>
      <Card>
        <Row>
          <Col span={12}>
            <strong>Tên:</strong> {user.name}
          </Col>
          <Col span={12}>
            <strong>Email:</strong> {user.email}
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <strong>Số điện thoại:</strong> {user.phone}
          </Col>
          <Col span={12}>
            <strong>Giới tính:</strong> {user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác'}
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <strong>Địa chỉ:</strong> {user.address}
          </Col>
          <Col span={12}>
            <strong>Ngày sinh:</strong> {dayjs(user.dateBirth).format('DD/MM/YYYY')}
          </Col>
        </Row>
        <Row>
          <Col span={12}>
            <strong>Quyền:</strong> {user.roleId.name}
          </Col>
          <Col span={12}>
            <strong>Trạng thái:</strong> {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default UserDetail;
