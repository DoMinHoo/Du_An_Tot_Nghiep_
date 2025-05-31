// src/pages/variants/ListVariant.jsx
import React from 'react';
import { Table, Card, Typography, Tag, Button, Space } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;

const ListVariant = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const dataSource = [
    {
      key: '1',
      id: '1',
      sku: 'SOFA001-BLACK',
      color: 'Đen',
      size: 'L',
      stock: 10,
      price: 13500000,
      status: 'active',
    },
    {
      key: '2',
      id: '2',
      sku: 'SOFA001-WHITE',
      color: 'Trắng',
      size: 'M',
      stock: 0,
      price: 13000000,
      status: 'sold_out',
    },
  ];

  const handleEdit = (record) => {
    navigate(`/admin/products/variants/edit/${record.id}`);
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
    },
    {
      title: 'Màu sắc',
      dataIndex: 'color',
    },
    {
      title: 'Kích cỡ',
      dataIndex: 'size',
    },
    {
      title: 'Kho',
      dataIndex: 'stock',
    },
    {
      title: 'Giá bán',
      dataIndex: 'price',
      render: (price) => `${price.toLocaleString()}₫`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status) => {
        let color = status === 'active' ? 'green' : 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Hành động',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button danger icon={<DeleteOutlined />}>
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={`📦 Biến thể sản phẩm - ID: ${productId}`}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate(`/admin/products/variants/create`)}
        >
          Thêm biến thể
        </Button>
      }
    >
      <Table columns={columns} dataSource={dataSource} pagination={false} />
    </Card>
  );
};

export default ListVariant;
