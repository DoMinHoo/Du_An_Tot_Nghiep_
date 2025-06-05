import { Table, Tag, Image, Space, Button, Popconfirm, Card, Tooltip, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { EditOutlined, DeleteOutlined, PlusOutlined, BranchesOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../Types/product.interface';
import { deleteProduct, getProducts } from '../../Services/products.service';

const ProductList = () => {
  const navigate = useNavigate();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const handleEdit = (product: Product) => {
    navigate(`/admin/products/edit/${product._id}`);
  };

  const queryClient = useQueryClient();

  const { mutate: deleteMutate } = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
    message.success('Xoá sản phẩm thành công');
    queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => {
      message.error('Xoá sản phẩm thất bại');
    },
    });
    const handleDelete = (product: Product) => {
      deleteMutate(product._id);
  };



  const formatPercent = (original: number, discounted?: number) => {
    if (!original || !discounted || discounted >= original) return '';
    const percent = Math.round(((original - discounted) / original) * 100);
    return `(-${percent}%)`;
  };

  const columns = [
    {
      title: 'Ảnh',
      dataIndex: 'image',
      key: 'image',
      render: (images: string[]) => (
        <Image
          width={60}
          height={60}
          style={{ objectFit: 'cover', borderRadius: 8 }}
          src={images[0] || ''}
          alt="Product"
          placeholder
        />
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'descriptionShort',
      key: 'descriptionShort',
      ellipsis: true,
    },
    {
      title: 'Thông tin',
      key: 'info',
      render: (_: unknown, record: Product) => (
        <div style={{ lineHeight: '1.6' }}>
          <div><strong>Chất liệu:</strong> {record.material}</div>
          <div><strong>Kích thước:</strong> {record.dimensions}</div>
          <div><strong>Khối lượng:</strong> {record.weight} kg</div>
          <div><strong>Kho:</strong> {record.stock_quantity}</div>
        </div>
      ),
    },
    {
      title: 'Giá',
      key: 'priceGroup',
      render: (_: unknown, record: Product) => (
        <div style={{ lineHeight: '1.6' }}>
          <div>
            <Tag color="blue">Giá bán: ${record.price.toFixed(2)}</Tag>
          </div>
          <div>
            <Tag color="purple">Giá nhập: ${record.importPrice.toFixed(2)}</Tag>
          </div>
          <div>
            <Tag color="green">
              KM: {record.salePrice ? `$${record.salePrice.toFixed(2)}` : '-'}{' '}
              <span style={{ fontWeight: 500, color: '#3f8600' }}>
                {formatPercent(record.price, record.salePrice)}
              </span>
            </Tag>
          </div>
          <div>
            <Tag color="red">
              Flash: {record.flashSale_discountedPrice ? `$${record.flashSale_discountedPrice.toFixed(2)}` : '-'}{' '}
              <span style={{ fontWeight: 500, color: '#cf1322' }}>
                {formatPercent(record.price, record.flashSale_discountedPrice)}
              </span>
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Flash Sale',
      key: 'flashSale',
      render: (_: unknown, record: Product) =>
        record.flashSale_start && record.flashSale_end ? (
          <span style={{ fontSize: 12 }}>
            {format(new Date(record.flashSale_start), 'PP')} - {format(new Date(record.flashSale_end), 'PP')}
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'categoryId',
      key: 'categoryId',
      render: (category: { name?: string }) => category?.name || 'N/A',
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
      render: (status: string) => {
        const color =
          status === 'active' ? 'green' : status === 'hidden' ? 'orange' : 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => format(new Date(date), 'PPp'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      fixed: 'right' as const,
      render: (_: unknown, record: Product) => (
        <Space>
         <Tooltip title="Biến thể">
          <Button
            icon={<BranchesOutlined />}
            onClick={() => navigate(`/admin/products/variants/${record._id}`)}
          />
        </Tooltip>
          <Tooltip title="Sửa">
            <Button type="primary" icon={<EditOutlined />} shape="circle" onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Xoá">
            <Popconfirm
              title="Xác nhận xoá sản phẩm?"
              onConfirm={() => handleDelete(record)}
            >
              <Button danger icon={<DeleteOutlined />} shape="circle" />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="🛍️ Danh sách sản phẩm"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admin/products/create')}>
          Thêm sản phẩm
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={products}
        loading={isLoading}
        rowKey="_id"
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default ProductList;