import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  fetchPromotions,
  deletePromotion,
} from '../../Services/promotion.service';

const { Title } = Typography;

const ListPromotion: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['promotions'],
    queryFn: fetchPromotions,
  });

  const mutation = useMutation({
    mutationFn: deletePromotion,
    onSuccess: () => {
      message.success('Xoá mã thành công');
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
    },
    onError: () => {
      message.error('Xoá mã thất bại');
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
      render: (limit: number) =>
        limit === 0 ? 'Không giới hạn' : limit,
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
              onClick={() =>
                navigate(`/admin/promotions/edit/${record._id}`)
              }
            />
          </Tooltip>
          <Tooltip title="Xoá">
            <Popconfirm
              title="Bạn chắc chắn muốn xoá mã này?"
              onConfirm={() => handleDelete(record._id)}
              okText="Xoá"
              cancelText="Huỷ"
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/promotions/create')}
          >
            Thêm mới
          </Button>
        }
        bordered
        style={{ borderRadius: 12 }}
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
