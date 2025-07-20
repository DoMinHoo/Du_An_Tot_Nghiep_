    'use client';

    import React from 'react';
    import {
    UndoOutlined,
    EyeOutlined,
    ArrowLeftOutlined,
    TagOutlined,
    ShoppingOutlined,
    DollarOutlined,
    CalendarOutlined,
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
    Typography,
    Statistic,
    Row,
    Col,
    Badge,
    Avatar,
    Input,
    } from 'antd';
    import { format } from 'date-fns';
    import { useNavigate, useParams } from 'react-router-dom';
    import {
    getDeletedVariations,
    restoreVariation,
    } from '../../../Services/productVariation.Service';
    import type { ProductVariation } from '../../../Types/productVariant.interface';

    const { Title, Text } = Typography;
    const { Search } = Input;

    const RestoreVariationList = () => {
    const { id } = useParams(); // Lấy productId từ URL
    const navigate = useNavigate();
    const queryClient = useQueryClient();

        console.log('Product ID from useParams:', id);

        if (!id) {
            message.error('Không tìm thấy ID sản phẩm');
            return null;
        }

        const {
            data: variations,
            isLoading,
            error,
        // eslint-disable-next-line react-hooks/rules-of-hooks
        } = useQuery<ProductVariation[]>({
            queryKey: ['deletedVariations', id],
            queryFn: () => getDeletedVariations(id),
            enabled: !!id,
            onError: (err) => {
            console.error('Query error:', err);
            message.error('Không thể tải danh sách biến thể đã xóa');
            },
        });

    // Mutation để khôi phục biến thể
    const { mutate: restoreMutate } = useMutation({
        mutationFn: (variationId: string) => restoreVariation(id!, variationId),
        onSuccess: () => {
        message.success('✅ Khôi phục biến thể thành công');
        queryClient.invalidateQueries({ queryKey: ['deletedVariations', id] });
        queryClient.invalidateQueries({ queryKey: ['variations', id] }); // Cập nhật danh sách biến thể chính
        },
        onError: () => {
        message.error('❌ Khôi phục biến thể thất bại');
        },
    });

    // Xử lý tìm kiếm
    const [searchText, setSearchText] = React.useState('');
    const filteredVariations = variations?.filter(
        (variation) =>
        variation.name.toLowerCase().includes(searchText.toLowerCase()) ||
        variation.sku.toLowerCase().includes(searchText.toLowerCase())
    );

    // Tính toán thống kê
    const totalDeletedVariations = filteredVariations?.length || 0;

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
        title: 'Ngày xóa',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        width: 120,
        render: (date: string) => (
            <div style={{ textAlign: 'center' }}>
            <CalendarOutlined style={{ color: '#ff4d4f', marginBottom: '4px' }} />
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
            <Popconfirm
                title="Xác nhận khôi phục biến thể?"
                description="Biến thể sẽ được khôi phục và hiển thị lại trong danh sách."
                onConfirm={() => restoreMutate(record._id)}
                okText="Khôi phục"
                cancelText="Hủy"
                okButtonProps={{ style: { backgroundColor: '#52c41a' } }}
            >
                <Button
                icon={<UndoOutlined />}
                size="small"
                shape="circle"
                style={{
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a',
                    color: '#fff',
                }}
                />
            </Popconfirm>
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
                onClick={() => navigate(`/admin/products/variants/${id}`)}
                icon={<ArrowLeftOutlined />}
                size="large"
                style={{ borderRadius: '8px' }}
                >
                Quay lại danh sách biến thể
                </Button>
                <div>
                <Title level={2} style={{ margin: 0, color: '#ff4d4f' }}>
                    🗑️ Danh sách biến thể đã xóa
                </Title>
                <Text type="secondary">
                    Quản lý và khôi phục các biến thể đã xóa mềm của sản phẩm
                </Text>
                </div>
            </div>
            </div>

            {/* Statistics Card */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={6}>
                <Card
                size="small"
                style={{ borderRadius: '8px', border: '1px solid #fff2f0' }}
                >
                <Statistic
                    title="Tổng biến thể đã xóa"
                    value={totalDeletedVariations}
                    prefix={<TagOutlined style={{ color: '#ff4d4f' }} />}
                    valueStyle={{
                    color: '#ff4d4f',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    }}
                />
                </Card>
            </Col>
            </Row>

            {/* Search Bar */}
            <Search
            placeholder="Tìm kiếm theo tên hoặc SKU..."
            allowClear
            enterButton="Tìm kiếm"
            size="large"
            onSearch={(value) => setSearchText(value)}
            style={{ marginBottom: '16px', maxWidth: '400px' }}
            />
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
            dataSource={filteredVariations}
            loading={isLoading}
            rowKey="_id"
            scroll={{ x: 1000 }}
            pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                `${range[0]}-${range[1]} của ${total} biến thể đã xóa`,
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

    export default RestoreVariationList;
