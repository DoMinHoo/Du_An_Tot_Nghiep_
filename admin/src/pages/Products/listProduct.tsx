
import React from 'react';
import {
  Table,
  Tag,
  Image,
  Card,
  Typography,
  Tooltip,
  Space,
  Button,
  Popconfirm,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  EyeInvisibleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  FireOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const { Text, Paragraph } = Typography;

const ListProduct = () => {
  const navigate = useNavigate();

  const handleAdd = () => {
    navigate('/admin/products/create');
  };

  const handleEdit = (record) => {
    message.info(`Sửa sản phẩm: ${record.name}`);
    navigate('/admin/products/edit/:id')
    // Navigate to edit page or open modal
  };

  const handleDelete = (record) => {
    message.success(`Đã xóa sản phẩm: ${record.name}`);
    // Implement delete logic
  };

  const dataSource = [
    {
      key: '1',
      name: 'Ghế Sofa Cao Cấp',
      descriptionShort: 'Sofa bọc da thật, thiết kế châu Âu hiện đại.',
      material: 'Da thật',
      dimensions: '200x90x100 cm',
      weight: 45,
      price: 15000000,
      importPrice: 10000000,
      salePrice: 13500000,
      flashSale_discountedPrice: 12000000,
      categoryId: 'Phòng khách',
      images: ['https://via.placeholder.com/100'],
      totalPurchased: 120,
      status: 'active',
      createdAt: '2025-01-01T12:00:00Z',
    },
    {
      key: '2',
      name: 'Bàn Làm Việc Gỗ Tự Nhiên',
      descriptionShort: 'Bàn gỗ sồi, thiết kế tối giản.',
      material: 'Gỗ sồi',
      dimensions: '120x60x75 cm',
      weight: 30,
      price: 5000000,
      importPrice: 3500000,
      salePrice: null,
      flashSale_discountedPrice: null,
      categoryId: 'Văn phòng',
      images: ['https://via.placeholder.com/100'],
      totalPurchased: 85,
      status: 'sold_out',
      createdAt: '2025-02-10T10:00:00Z',
    },
  ];

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Image src={record.images[0]} width={60} style={{ borderRadius: 8 }} />
          <div>
            <Text strong>{text}</Text>
            <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ maxWidth: 200 }}>
              {record.descriptionShort}
            </Paragraph>
          </div>
        </Space>
      ),
    },
    {
      title: 'Chất liệu / Kích thước',
      key: 'material',
      render: (_, record) => (
        <div>
          <Text>{record.material}</Text>
          <br />
          <Text type="secondary">{record.dimensions}</Text>
        </div>
      ),
    },
    {
      title: 'Giá',
      key: 'pricing',
      render: (_, record) => (
        <div>
          <Tooltip title="Giá gốc">
            <Text delete type="secondary">
              <DollarOutlined /> {record.price.toLocaleString()}₫
            </Text>
          </Tooltip>
          <br />
          {record.salePrice && (
            <Tooltip title="Giá khuyến mãi">
              <Text type="warning">
                <FireOutlined /> {record.salePrice.toLocaleString()}₫
              </Text>
              <br />
            </Tooltip>
          )}
          {record.flashSale_discountedPrice && (
            <Tooltip title="Flash Sale">
              <Text type="danger">
                <ThunderboltOutlined /> {record.flashSale_discountedPrice.toLocaleString()}₫
              </Text>
            </Tooltip>
          )}
          {!record.salePrice && !record.flashSale_discountedPrice && (
            <Text type="secondary">Không có khuyến mãi</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'categoryId',
      key: 'categoryId',
    },
    {
      title: 'Đã bán',
      dataIndex: 'totalPurchased',
      key: 'totalPurchased',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'green';
        let icon = <CheckCircleOutlined />;
        if (status === 'hidden') {
          color = 'orange';
          icon = <EyeInvisibleOutlined />;
        }
        if (status === 'sold_out') {
          color = 'red';
          icon = <CloseCircleOutlined />;
        }
        return <Tag color={color} icon={icon}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (val) => new Date(val).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xoá sản phẩm?"
            onConfirm={() => handleDelete(record)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Xoá
            </Button>
            <Button
              type="dashed"
              onClick={() => navigate(`/admin/products/variants/${record.key}`)}
            >
              Biến thể
            </Button>

          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="🛒 Danh sách sản phẩm"
      style={{ margin: 24 }}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Thêm sản phẩm
        </Button>
      }
    >
      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={{ pageSize: 5 }}
        scroll={{ x: 1200 }}
        bordered
      />
    </Card>
  );
};

export default ListProduct;

