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
import type { ProductVariation } from '../../Types/productVariant.interface';
import { deleteProduct, getProducts } from '../../Services/products.service';
import { useMemo } from 'react';
import { getVariations } from '../../Services/productVariation.Service';

interface ProductWithVariations extends Product {
  variations?: ProductVariation[];
}

const ProductList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch danh sách sản phẩm
  const { data: products, isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  // Fetch biến thể cho tất cả sản phẩm
  const { data: variationsMap = {}, isLoading: isLoadingVariations } = useQuery<
    Record<string, ProductVariation[]>
  >({
    queryKey: ['allVariations'],
    queryFn: async () => {
      if (!products) return {};
      const variationPromises = products.map((product) =>
        getVariations(product._id).then((variations) => ({
          [product._id]: variations,
        }))
      );
      const variationResults = await Promise.all(variationPromises);
      return Object.assign({}, ...variationResults);
    },
    enabled: !!products && products.length > 0,
  });

  // Kết hợp sản phẩm với biến thể
  const productsWithVariations: ProductWithVariations[] = useMemo(() => {
    return (
      products?.map((product) => ({
        ...product,
        variations: variationsMap[product._id] || [],
      })) || []
    );
  }, [products, variationsMap]);

  const { mutate: deleteMutate } = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      message.success('Xoá sản phẩm thành công');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['allVariations'] });
    },
    onError: () => {
      message.error('Xoá sản phẩm thất bại');
    },
  });

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
      title: 'Thương hiệu',
      dataIndex: 'brand',
      key: 'brand',
    },
    {
      title: 'Mô tả ngắn',
      dataIndex: 'descriptionShort',
      key: 'descriptionShort',
      ellipsis: true,
    },
    {
      title: 'Chất liệu',
      dataIndex: 'variations',
      key: 'materialVariation',
      render: (variations: ProductVariation[]) => {
        if (!variations || variations.length === 0) {
          return <span>N/A</span>;
        }
        const materials = variations
          .map((variation) => variation.materialVariation)
          .filter((material) => material)
          .join(', ');
        return <span>{materials || 'N/A'}</span>;
      },
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
        dataSource={productsWithVariations}
        loading={isLoadingProducts || isLoadingVariations}
        rowKey="_id"
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default ProductList;
