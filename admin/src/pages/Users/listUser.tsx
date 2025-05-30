import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Layout, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

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

const ListUser: React.FC = () => {
  const [data, setData] = useState<User[]>([]);
  const navigate = useNavigate();

  // Giả sử đang đăng nhập với quyền admin
  const currentUserRole = 'admin';

  useEffect(() => {
    const storedData = localStorage.getItem('userData');
    if (storedData) {
      setData(JSON.parse(storedData));
    }
  }, []);

  // Đổi trạng thái active/inactive và lưu localStorage
  const toggleUserStatus = (id: number) => {
    const updatedData = data.map(user => {
      if (user.id === id) {
        return {
          ...user,
          status: user.status === 'active' ? 'inactive' : 'active',
        };
      }
      return user;
    });
    setData(updatedData);
    localStorage.setItem('userData', JSON.stringify(updatedData));
    message.success('Cập nhật trạng thái người dùng thành công!');
  };

  const columns: ColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Quyền', dataIndex: 'role', key: 'role' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: User['status']) => (
        <Tag
          icon={status === 'active' ? <CheckCircleOutlined /> : <StopOutlined />}
          color={status === 'active' ? 'green' : 'volcano'}
          style={{ fontWeight: 'bold', fontSize: 14, padding: '4px 12px', borderRadius: '999px' }}
        >
          {status === 'active' ? 'Hoạt động' : 'Khoá'}
        </Tag>
      ),
    },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record: User) => (
        <>
          <Button
            type="link"
            onClick={() => navigate(`/admin/users/${record.id}`)}
            style={{ marginRight: 8 }}
          >
            Xem chi tiết
          </Button>

          <Button
            type="primary"
            style={{
              backgroundColor: record.status === 'active' ? 'purple' : '#1677ff',
              borderColor: record.status === 'active' ? 'purple' : '#1677ff',
            }}
            onClick={() => toggleUserStatus(record.id)}
          >
            {record.status === 'active' ? 'Khoá' : 'Kích hoạt'}
          </Button>
        </>
      ),
    },
  ];

  return (
  
   
        <Content style={{ margin: '16px' }}>
          {/* Bỏ nút thêm người dùng */}
          <Table columns={columns} dataSource={data} pagination={false} />
        </Content>
   
  );
};

export default ListUser;
