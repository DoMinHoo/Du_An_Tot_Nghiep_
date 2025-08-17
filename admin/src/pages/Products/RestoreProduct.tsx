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
import { UndoOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../Types/product.interface';
import {
    restoreProduct,
    hardDeleteProduct,
    getProductMaterials,
} from '../../Services/products.service';
import { useEffect, useState } from 'react';

const RestoreProduct = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [materialsMap, setMaterialsMap] = useState<Record<string, string>>({});

    // Lấy danh sách sản phẩm đã xóa mềm
    const {
        data: products,
        isLoading,
        error,
    } = useQuery<Product[]>({
        queryKey: ['deletedProducts'],
        queryFn: async () => {
            const response = await fetch(
                'http://localhost:5000/api/products?isDeleted=true',
                {
                    headers: { 'Cache-Control': 'no-cache' }, // Tránh cache
                }
            );
            if (!response.ok) {
                throw new Error('Không thể lấy danh sách sản phẩm đã xóa mềm');
            }
            const data = await response.json();
            // Lọc dữ liệu để chỉ hiển thị sản phẩm đã xóa mềm
            const filteredProducts = data.data.filter(
                (product: Product) => product.isDeleted === true
            );
            if (filteredProducts.length === 0) {
                message.warning('Không có sản phẩm nào đã xóa mềm');
            }
            return filteredProducts;
        },
        retry: 1, // Thử lại 1 lần nếu lỗi
        staleTime: 0, // Không sử dụng cache cũ
    });

    // Hiển thị lỗi nếu có
    useEffect(() => {
        if (error) {
            message.error(
                error.message || 'Lỗi khi lấy danh sách sản phẩm đã xóa mềm'
            );
        }
    }, [error]);

    // Mutation cho khôi phục
    const { mutate: restoreMutate } = useMutation({
        mutationFn: (id: string) => restoreProduct(id),
        onSuccess: () => {
            message.success('Khôi phục sản phẩm thành công');
            queryClient.invalidateQueries({ queryKey: ['deletedProducts'] });
        },
        onError: (error: any) => {
            message.error(
                error.response?.data?.message || 'Khôi phục sản phẩm thất bại'
            );
        },
    });

    // Mutation cho xóa vĩnh viễn
    const { mutate: hardDeleteMutate } = useMutation({
        mutationFn: (id: string) => hardDeleteProduct(id),
        onSuccess: () => {
            message.success('Xóa vĩnh viễn sản phẩm thành công');
            queryClient.invalidateQueries({ queryKey: ['deletedProducts'] });
        },
        onError: (error: any) => {
            message.error(
                error.response?.data?.message || 'Xóa vĩnh viễn sản phẩm thất bại'
            );
        },
    });

    // Lấy danh sách chất liệu
    useEffect(() => {
        if (!products || products.length === 0) return;

        const fetchMaterials = async () => {
            const map: Record<string, string> = {};
            await Promise.all(
                products.map(async (product) => {
                    try {
                        const materialName = await getProductMaterials(product._id);
                        map[product._id] = materialName || 'Không có';
                    } catch (err) {
                        map[product._id] = 'Lỗi';
                    }
                })
            );
            setMaterialsMap(map);
        };

        fetchMaterials();
    }, [products]);

    const handleRestore = (product: Product) => {
        restoreMutate(product._id);
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
            render: (_: any, record: Product) =>
                materialsMap[record._id] || 'Đang tải...',
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
            key: 'status',
            render: () => <Tag color="gray">ĐÃ XÓA</Tag>,
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
                    <Tooltip title="Khôi phục">
                        <Popconfirm
                            title="Xác nhận khôi phục sản phẩm?"
                            onConfirm={() => handleRestore(record)}
                        >
                            <Button type="default" icon={<UndoOutlined />} shape="circle" />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <Card
            title="🗑️ Quản lý sản phẩm đã xóa"
            extra={
                <Button type="default" onClick={() => navigate('/admin/products')}>
                    Quay lại danh sách sản phẩm
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={products}
                loading={isLoading}
                rowKey="_id"
                scroll={{ x: 'max-content' }}
                locale={{
                    emptyText: 'Không có sản phẩm nào đã xóa mềm',
                }}
            />
        </Card>
    );
};

export default RestoreProduct;
