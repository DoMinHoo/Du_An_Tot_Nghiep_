'use client';

import type React from 'react';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  ShoppingOutlined,
  TagOutlined,
  DollarOutlined,
  CalendarOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Image,
  message,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Statistic,
  Row,
  Col,
  Badge,
  Avatar,
} from 'antd';
import { format } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import {
  deleteVariation,
  getVariations,
} from '../../../Services/productVariation.Service';
import type { ProductVariation } from '../../../Types/productVariant.interface';

const { Title, Text } = Typography;

const ProductVariationList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: variations, isLoading } = useQuery<ProductVariation[]>({
    queryKey: ['variations', id],
    queryFn: () => getVariations(id!),
    enabled: !!id,
  });

  const { mutate: deleteMutate } = useMutation({
    mutationFn: (variationId: string) => deleteVariation(id!, variationId),
    onSuccess: (response) => {
      message.success(response.message || '✅ Xóa biến thể thành công');
      queryClient.invalidateQueries({ queryKey: ['variations', id] });
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || '❌ Xóa biến thể thất bại'
      );
    },
  });

  const handleEdit = (variation: ProductVariation) => {
    navigate(`/admin/products/variants/${id}/edit/${variation._id}`);
  };

  const handleDelete = (variation: ProductVariation) => {
    deleteMutate(variation._id);
  };

  // Calculate statistics
  const totalVariations = variations?.length || 0;
  const totalStock =
    variations?.reduce((sum, item) => sum + item.stockQuantity, 0) || 0;
  const averagePrice = variations?.length
    ? Math.round(
        variations.reduce((sum, item) => sum + item.finalPrice, 0) /
          variations.length
      )
    : 0;
  const lowStockCount =
    variations?.filter((item) => item.stockQuantity < 10).length || 0;

  const columns = [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 280,
      render: (_: unknown, record: ProductVariation) => {
        const isFullUrl = (url: string) => /^https?:\/\//.test(url);
        const imageUrl = record.colorImageUrl
          ? isFullUrl(record.colorImageUrl)
            ? record.colorImageUrl
            : `http://localhost:5000${record.colorImageUrl}`
          : '/placeholder.png';

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Avatar
              size={64}
              src={
                <Image
                  src={imageUrl}
                  alt={record.name}
                  style={{ objectFit: 'cover' }}
                  fallback="/placeholder.png"
                  preview={{
                    mask: <EyeOutlined style={{ fontSize: '16px' }} />,
                  }}
                />
              }
              style={{
                borderRadius: '8px',
                border: '2px solid #f0f0f0',
              }}
            />
            <div>
              <Text strong style={{ fontSize: '14px', display: 'block' }}>
                {record.name}
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                SKU: {record.sku}
              </Text>
              <div style={{ marginTop: '4px' }}>
                <Tag
                  color={record.colorHexCode}
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    border: `1px solid ${record.colorHexCode}20`,
                  }}
                >
                  {record.colorName}
                </Tag>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Thông số',
      key: 'specs',
      width: 200,
      render: (_: unknown, record: ProductVariation) => {
        const [length, width, height] = record.dimensions?.split('x') || [
          '0',
          '0',
          '0',
        ];
        return (
          <div>
            <div style={{ marginBottom: '4px' }}>
              <Text strong style={{ fontSize: '12px', color: '#666' }}>
                Kích thước:
              </Text>
              <br />
              <Text style={{ fontSize: '12px' }}>
                {`${length}×${width}×${height} cm`}
              </Text>
            </div>
            <div>
              <Text strong style={{ fontSize: '12px', color: '#666' }}>
                Chất liệu:
              </Text>
              <br />
              <Text style={{ fontSize: '12px' }}>
                {record.material?.name || '—'}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 100,
      align: 'center' as const,
      render: (qty: number) => (
        <div style={{ textAlign: 'center' }}>
          <Badge
            count={qty}
            style={{
              backgroundColor:
                qty < 10 ? '#ff4d4f' : qty < 50 ? '#faad14' : '#52c41a',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          />
          <div style={{ marginTop: '4px' }}>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {qty < 10 ? 'Sắp hết' : qty < 50 ? 'Ít' : 'Đủ'}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Giá cả',
      key: 'pricing',
      width: 180,
      render: (_: unknown, record: ProductVariation) => (
        <div>
          <div style={{ marginBottom: '4px' }}>
            <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
              {record.finalPrice.toLocaleString()} ₫
            </Text>
            <Text
              type="secondary"
              style={{ fontSize: '11px', marginLeft: '4px' }}
            >
              (Bán)
            </Text>
          </div>
          <div style={{ marginBottom: '2px' }}>
            <Text style={{ fontSize: '12px', color: '#666' }}>
              Nhập: {record.importPrice.toLocaleString()} ₫
            </Text>
          </div>
          {record.salePrice && record.salePrice > 0 && (
            <div>
              <Tag color="red" style={{ fontSize: '10px', padding: '0 4px' }}>
                KM: {record.salePrice.toLocaleString()} ₫
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <div style={{ textAlign: 'center' }}>
          <CalendarOutlined style={{ color: '#1890ff', marginBottom: '4px' }} />
          <div>
            <Text style={{ fontSize: '12px', display: 'block' }}>
              {format(new Date(date), 'dd/MM/yyyy')}
            </Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {format(new Date(date), 'HH:mm')}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      align: 'center' as const,
      render: (_: unknown, record: ProductVariation) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa biến thể">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              shape="circle"
              onClick={() => handleEdit(record)}
              style={{ backgroundColor: '#1890ff' }}
            />
          </Tooltip>
          <Tooltip title="Xóa mềm biến thể">
            <Popconfirm
              title="Xác nhận xóa mềm biến thể?"
              description="Biến thể sẽ được chuyển vào thùng rác và có thể khôi phục."
              onConfirm={() => handleDelete(record)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                shape="circle"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
      }}
    >
      {/* Header Section */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button
              onClick={() => navigate('/admin/products')}
              icon={<ArrowLeftOutlined />}
              size="large"
              style={{ borderRadius: '8px' }}
            >
              Quay lại sản phẩm
            </Button>
            <div>
              <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
                🔁 Danh sách biến thể sản phẩm
              </Title>
              <Text type="secondary">
                Quản lý các biến thể màu sắc và kích thước của sản phẩm
              </Text>
            </div>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate(`/admin/products/variants/${id}/create`)}
              size="large"
              style={{
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
              }}
            >
              Thêm biến thể mới
            </Button>
            <Button
              icon={<UndoOutlined />}
              onClick={() => navigate(`/admin/products/variants/${id}/deleted`)}
              size="large"
              style={{
                borderRadius: '8px',
                backgroundColor: '#ff4d4f',
                borderColor: '#ff4d4f',
                color: '#fff',
              }}
            >
              Xem biến thể đã xóa
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card
              size="small"
              style={{ borderRadius: '8px', border: '1px solid #e8f4ff' }}
            >
              <Statistic
                title="Tổng biến thể"
                value={totalVariations}
                prefix={<TagOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{
                  color: '#1890ff',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              size="small"
              style={{ borderRadius: '8px', border: '1px solid #f6ffed' }}
            >
              <Statistic
                title="Tổng tồn kho"
                value={totalStock}
                prefix={<ShoppingOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{
                  color: '#52c41a',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              size="small"
              style={{ borderRadius: '8px', border: '1px solid #fff7e6' }}
            >
              <Statistic
                title="Giá trung bình"
                value={averagePrice}
                prefix={<DollarOutlined style={{ color: '#faad14' }} />}
                suffix="₫"
                valueStyle={{
                  color: '#faad14',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              size="small"
              style={{ borderRadius: '8px', border: '1px solid #fff2f0' }}
            >
              <Statistic
                title="Sắp hết hàng"
                value={lowStockCount}
                prefix={<Badge status="error" />}
                valueStyle={{
                  color: '#ff4d4f',
                  fontSize: '20px',
                  fontWeight: 'bold',
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Table */}
      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #f0f0f0',
        }}
        bodyStyle={{ padding: '0' }}
      >
        <Table
          columns={columns}
          dataSource={variations}
          loading={isLoading}
          rowKey="_id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} biến thể`,
            style: { padding: '16px 24px' },
          }}
          rowClassName={(record, index) =>
            index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
          }
          style={
            {
              '--table-row-light': '#fafafa',
              '--table-row-dark': '#ffffff',
            } as React.CSSProperties
          }
        />
      </Card>

      <style>{`
        .table-row-light {
          background-color: var(--table-row-light);
        }
        .table-row-dark {
          background-color: var(--table-row-dark);
        }
        .table-row-light:hover,
        .table-row-dark:hover {
          background-color: #e6f7ff !important;
        }
      `}</style>
    </div>
  );
};

export default ProductVariationList;
