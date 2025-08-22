
import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, message, Popconfirm } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

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

const ListUser: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data);
    } catch (err: any) {
      message.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);

    }
  };
  const toggleStatus = async (id: string) => {
    try {
      const res = await axios.patch(`http://localhost:5000/api/users/${id}/toggle-status`);

      message.success(res.data.message);
      fetchUsers();
    } catch (err: any) {
      message.error('Không thể cập nhật trạng thái người dùng');
    }

  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: User, b: User) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a: User, b: User) => a.email.localeCompare(b.email),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      sorter: (a: User, b: User) => a.phone.localeCompare(b.phone),
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      sorter: (a: User, b: User) => a.gender.localeCompare(b.gender),
      render: (gender: string) =>
        gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      sorter: (a: User, b: User) => a.address.localeCompare(b.address),
    },
    {
      title: 'Ngày sinh',
      dataIndex: 'dateBirth',
      key: 'dateBirth',
      sorter: (a: User, b: User) =>
        dayjs(a.dateBirth).unix() - dayjs(b.dateBirth).unix(),
      render: (value: string) =>
        value ? dayjs(value).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Quyền',
      dataIndex: ['roleId', 'name'],
      key: 'role',
      render: (role: string) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'volcano'}>
          {status === 'active' ? 'Hoạt động' : 'Đã khóa'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Popconfirm
            title={`Bạn có chắc chắn muốn ${record.status === 'active' ? 'khóa' : 'mở khóa'}?`}
            onConfirm={() => toggleStatus(record._id)}
          >
            <Button>{record.status === 'active' ? 'Khóa' : 'Mở khóa'}</Button>
          </Popconfirm>
          <Button type="primary" onClick={() => navigate(`/admin/users/${record._id}`)}>
            Chỉnh sửa
          </Button>
        </Space>
      ),
    },
  ];

  return (

    <div>
      <h2 style={{ marginBottom: 20 }}>Danh sách người dùng</h2>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="_id"
        loading={loading}
        bordered
        scroll={{ x: 1200 }}
      />
    </div>

  );
};

export default ListUser;
