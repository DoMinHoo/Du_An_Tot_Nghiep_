import React, { useEffect, useState, useMemo } from 'react';
import { Table, Tag, Space, Button, message, Popconfirm, Input } from 'antd';
import axios from 'axios';
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

const fakeUsers: User[] = [
  {
    key: '1',
    _id: '1',
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    email: 'a.nguyen@example.com',
    roleId: { name: 'admin' },
    status: 'active',
    address: 'Hà Nội',
    gender: 'male',
    dateBirth: '1990-01-01',
  },
  {
    key: '2',
    _id: '2',
    name: 'Trần Thị B',
    phone: '0912345678',
    email: 'b.tran@example.com',
    roleId: { name: 'custom' },
    status: 'inactive',
    address: 'TP. Hồ Chí Minh',
    gender: 'female',
    dateBirth: '1992-02-02',
  },
  {
    key: '3',
    _id: '3',
    name: 'Lê Văn C',
    phone: '0923456789',
    email: 'c.le@example.com',
    roleId: { name: 'custom' },
    status: 'active',
    address: 'Đà Nẵng',
    gender: 'male',
    dateBirth: '1993-03-03',
  },
  {
    key: '4',
    _id: '4',
    name: 'Phạm Thị D',
    phone: '0934567890',
    email: 'd.pham@example.com',
    roleId: { name: 'custom' },
    status: 'inactive',
    address: 'Cần Thơ',
    gender: 'female',
    dateBirth: '1994-04-04',
  },
  {
    key: '5',
    _id: '5',
    name: 'Đỗ Văn E',
    phone: '0945678901',
    email: 'e.do@example.com',
    roleId: { name: 'admin' },
    status: 'active',
    address: 'Hải Phòng',
    gender: 'male',
    dateBirth: '1995-05-05',
  },
];

const ListUser: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

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

  const normalize = (str?: string) =>
    (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const filteredUsers = useMemo(() => {
    if (!searchText) return users;
    const q = normalize(searchText);
    return users.filter((u) => {
      return (
        normalize(u.name).includes(q) ||
        normalize(u.email).includes(q) ||
        normalize(u.phone).includes(q) ||
        normalize(u.address).includes(q)
      );
    });
  }, [users, searchText]);

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
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Danh sách người dùng</h2>

      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Tìm theo tên, email, số điện thoại, địa chỉ..."
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey="_id"
        loading={loading}
        bordered
        scroll={{ x: 1200 }}
      />
    </div>
  );
};
 
export default ListUser;
 