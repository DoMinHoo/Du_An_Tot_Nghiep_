import {
  Table,
  Tag,
  Image,
  Space,
  Button,
  Popconfirm,
  Card,
  Tooltip,
  message,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../Types/product.interface';
import { deleteProduct, getProductMaterials, getProducts } from '../../Services/products.service';
import { useEffect, useState } from 'react';

const ProductList = () => {
  const navigate = useNavigate();

  const [materialsMap, setMaterialsMap] = useState<Record<string, string>>({});



  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

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

  useEffect(() => {
    if (!products || products.length === 0) return;

    const fetchMaterials = async () => {
      const map: Record<string, string> = {};

      await Promise.all(
        products.map(async (product) => {
          try {
            const materialName = await getProductMaterials(product._id);
            map[product._id] = materialName || "Không có";
          } catch (err) {
            map[product._id] = "Lỗi";
          }
        })
      );

      setMaterialsMap(map);
    };

    fetchMaterials();
  }, [products]);

  const handleEdit = (product: Product) => {
    navigate(`/admin/products/edit/${product._id}`);
  };

  const handleDelete = (product: Product) => {
    deleteMutate(product._id);
  };

  const columns = [
    {
      title: 'Ảnh',
      dataIndex: 'image',
      key: 'image',
      render: (images: string[]) => {
        const isFullUrl = (url: string) => /^https?:\/\//.test(url);
        const imageUrl =
          Array.isArray(images) && images.length > 0 && images[0]
            ? isFullUrl(images[0])
              ? images[0]
              : `http://localhost:5000${images[0]}`
            : '/placeholder.png';
        return (
          <Image
            width={60}
            height={60}
            style={{ objectFit: 'cover', borderRadius: 8 }}
            src={imageUrl}
            alt="Product"
            placeholder
            fallback="/placeholder.png"
            onError={() => console.error('Failed to load image:', imageUrl)}
          />
        );
      },
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Mô tả ngắn',
      dataIndex: 'descriptionShort',
      key: 'descriptionShort',
      ellipsis: true,
    },
    {
      title: 'Chất liệu',
      key: 'material',
      render: (_: any, record: Product) => materialsMap[record._id] || 'Đang tải...',
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
          status === 'active'
            ? 'green'
            : status === 'hidden'
              ? 'orange'
              : 'red';
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
            <Button
              type="primary"
              icon={<EditOutlined />}
              shape="circle"
              onClick={() => handleEdit(record)}
            />
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
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/admin/products/create')}
        >
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
