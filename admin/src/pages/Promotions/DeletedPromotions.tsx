    // src/components/DeletedPromotions.tsx
    import React from 'react';
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
    } from 'antd';
    import { UndoOutlined, DeleteOutlined } from '@ant-design/icons';
    import {
    fetchDeletedPromotions,
    restorePromotion,
    permanentDeletePromotion,
    } from '../../services/promotion.service';

    const { Title } = Typography;

    const DeletedPromotions: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery({
        queryKey: ['deletedPromotions'],
        queryFn: fetchDeletedPromotions,
    });

    const restoreMutation = useMutation({
        mutationFn: restorePromotion,
        onSuccess: () => {
        message.success('Khôi phục mã thành công');
        queryClient.invalidateQueries({ queryKey: ['deletedPromotions'] });
        queryClient.invalidateQueries({ queryKey: ['promotions'] }); // Cập nhật danh sách chính
        },
        onError: () => {
        message.error('Khôi phục mã thất bại');
        },
    });

    const permanentDeleteMutation = useMutation({
        mutationFn: permanentDeletePromotion,
        onSuccess: () => {
        message.success('Xóa vĩnh viễn mã thành công');
        queryClient.invalidateQueries({ queryKey: ['deletedPromotions'] });
        },
        onError: () => {
        message.error('Xóa vĩnh viễn mã thất bại');
        },
    });

    const handleRestore = (id: string) => {
        restoreMutation.mutate(id);
    };

    const handlePermanentDelete = (id: string) => {
        permanentDeleteMutation.mutate(id);
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
        title: 'Xóa lúc',
        dataIndex: 'deletedAt',
        key: 'deletedAt',
        render: (date: string) =>
            date
            ? new Date(date).toLocaleString('vi-VN', {
                dateStyle: 'short',
                timeStyle: 'short',
                })
            : 'Không có',
        },
        {
        title: 'Hành động',
        key: 'action',
        align: 'center' as const,
        fixed: 'right' as const,
        width: 150,
        render: (_: any, record: any) => (
            <Space>
            <Tooltip title="Khôi phục">
                <Popconfirm
                title="Bạn chắc chắn muốn khôi phục mã này?"
                onConfirm={() => handleRestore(record._id)}
                okText="Khôi phục"
                cancelText="Hủy"
                >
                <Button type="text" icon={<UndoOutlined />} />
                </Popconfirm>
            </Tooltip>
            <Tooltip title="Xóa vĩnh viễn">
                <Popconfirm
                title="Bạn chắc chắn muốn xóa vĩnh viễn mã này? Hành động này không thể hoàn tác!"
                onConfirm={() => handlePermanentDelete(record._id)}
                okText="Xóa vĩnh viễn"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                >
                <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            </Tooltip>
            </Space>
        ),
        },
    ];

    if (isLoading) return <p>Đang tải dữ liệu...</p>;
    if (isError) return <p>Đã xảy ra lỗi khi tải danh sách mã đã xóa.</p>;

    return (
        <div style={{ padding: 24 }}>
        <Card
            title={<Title level={4}>🗑️ Danh sách Mã Khuyến Mãi Đã Xóa</Title>}
            extra={
            <Button type="primary" onClick={() => navigate('/admin/promotions')}>
                Quay lại danh sách chính
            </Button>
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

    export default DeletedPromotions;
