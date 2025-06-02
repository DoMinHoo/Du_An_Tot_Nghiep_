import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Button, Tag, Layout } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircleOutlined, StopOutlined } from '@ant-design/icons';


const { Content } = Layout;

interface User {
  key: string;
  id: number;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  address: string;
}

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      const users: User[] = JSON.parse(storedData);
      const foundUser = users.find(u => u.id === Number(id));
      setUser(foundUser || null);
    }
  }, [id]);

  return (
   
        <Content style={{ margin: '24px' }}>
          <Button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
            ← Quay lại
          </Button>

          {user ? (
            <Card title={`Thông tin chi tiết người dùng: ${user.name}`} bordered={false}>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="ID">{user.id}</Descriptions.Item>
                <Descriptions.Item label="Họ tên">{user.name}</Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">{user.phone}</Descriptions.Item>
                <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                <Descriptions.Item label="Quyền">{user.role}</Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag
                    icon={user.status === 'active' ? <CheckCircleOutlined /> : <StopOutlined />}
                    color={user.status === 'active' ? 'green' : 'volcano'}
                    style={{ fontWeight: 'bold', fontSize: 14, padding: '4px 12px', borderRadius: '999px' }}
                  >
                    {user.status === 'active' ? 'Hoạt động' : 'Khoá'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">{user.address}</Descriptions.Item>
              </Descriptions>
            </Card>
          ) : (
            <p>Không tìm thấy người dùng.</p>
          )}
        </Content>
   
  );
};

export default UserDetail;
