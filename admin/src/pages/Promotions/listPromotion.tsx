// src/components/ListPromotion.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  Tag,
  Typography,
  Button,
  Space,
  Popconfirm,
  message,
  Card,
  Tooltip,
  Input,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  fetchPromotions,
  softDeletePromotion,
} from '../../Services/promotion.service';

const { Title } = Typography;
const { Search } = Input;

const ListPromotion: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['promotions', searchText],
    queryFn: () => fetchPromotions(), // Có thể thêm query params để tìm kiếm nếu backend hỗ trợ
    select: (data) =>
      searchText
        ? data.filter((promo) =>
          promo.code.toLowerCase().includes(searchText.toLowerCase())
        )
        : data,
  });

  const mutation = useMutation({
    mutationFn: softDeletePromotion,
    onSuccess: () => {
      message.success('Xóa mềm mã thành công');
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
    onError: () => {
      message.error('Xóa mềm mã thất bại');
    },
  });

  const handleDelete = (id: string) => {
    mutation.mutate(id);
  };

  const formatCurrency = (value: number) =>
    value?.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
    });

  const columns = [
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Loại',
      dataIndex: 'discountType',
      key: 'discountType',
      render: (type: string) =>
        type === 'percentage' ? 'Phần trăm (%)' : 'Cố định (VNĐ)',
    },
    {
      title: 'Giá trị',
      dataIndex: 'discountValue',
      key: 'discountValue',
      render: (value: number, record: any) =>
        record.discountType === 'percentage'
          ? `${value}%`
          : formatCurrency(value),
    },
    
    // Giá tối đa được giảm
    {
      title: 'Giá tối đa được giảm',
      dataIndex: 'maxDiscountPrice',
      key: 'maxDiscountPrice',
      render: (value: number) =>
        value && value > 0 ? formatCurrency(value) : 'Không giới hạn',
    },

    {
      title: 'Tối thiểu',
      dataIndex: 'minOrderValue',
      key: 'minOrderValue',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Giới hạn',
      dataIndex: 'usageLimit',
      key: 'usageLimit',
      render: (limit: number) => (limit === 0 ? 'Không giới hạn' : limit),
    },
    {
      title: 'Đã dùng',
      dataIndex: 'usedCount',
      key: 'usedCount',
    },
    {
      title: 'Hết hạn',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString() : 'Không có',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) =>
        active ? (
          <Tag color="green">Hoạt động</Tag>
        ) : (
          <Tag color="red">Ngưng</Tag>
        ),
    },
    {
      title: 'Tạo lúc',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) =>
        new Date(date).toLocaleString('vi-VN', {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) =>
        new Date(date).toLocaleString('vi-VN', {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center' as const,
      fixed: 'right' as const,
      width: 100,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/promotions/edit/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Xóa mềm">
            <Popconfirm
              title="Bạn chắc chắn muốn xóa mềm mã này?"
              onConfirm={() => handleDelete(record._id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (isLoading) return <p>Đang tải dữ liệu...</p>;
  if (isError) return <p>Đã xảy ra lỗi khi tải mã khuyến mãi.</p>;

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<Title level={4}>🎁 Danh sách Mã Khuyến Mãi</Title>}
        extra={
          <Space>
            <Search
              placeholder="Tìm kiếm mã khuyến mãi"
              allowClear
              onSearch={(value) => setSearchText(value)}
              style={{ width: 200 }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/promotions/create')}
            >
              Thêm mới
            </Button>
            <Button onClick={() => navigate('/admin/promotions/deleted')}>
              Xem mã đã xóa
            </Button>
          </Space>
        }
        bordered
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="_id"
          pagination={{ pageSize: 8 }}
          scroll={{ x: 'max-content' }}
          bordered
        />
      </Card>
    </div>
  );
};

export default ListPromotion;
