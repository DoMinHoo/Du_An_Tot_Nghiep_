import React from 'react';
import { Button, Layout, Popconfirm, Space, Table, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getDeletedCategories,
    restoreCategory,
    hardDeleteCategory,
} from '../../Services/categories.service';
import { Link } from 'react-router-dom';

const { Content } = Layout;

const DeletedCategoryManager: React.FC = () => {
    const queryClient = useQueryClient();

    // Lấy danh sách danh mục đã xóa mềm
    const { data = [], isLoading } = useQuery({
        queryKey: ['deletedCategories'],
        queryFn: getDeletedCategories,
    });

    // Mutation khôi phục danh mục
    const restoreMutation = useMutation({
        mutationFn: restoreCategory,
        onSuccess: () => {
            message.success('Khôi phục danh mục thành công');
            queryClient.invalidateQueries({ queryKey: ['deletedCategories'] });
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
        onError: (error: any) => {
            message.error(
                error?.response?.data?.message || 'Khôi phục danh mục thất bại'
            );
        },
    });

    // Mutation xóa vĩnh viễn danh mục
    const hardDeleteMutation = useMutation({
        mutationFn: hardDeleteCategory,
        onSuccess: () => {
            message.success('Xóa vĩnh viễn danh mục thành công');
            queryClient.invalidateQueries({ queryKey: ['deletedCategories'] });
        },
        onError: (error: any) => {
            message.error(
                error?.response?.data?.message || 'Xóa vĩnh viễn danh mục thất bại'
            );
        },
    });

    // Xác nhận khôi phục
    const confirmRestore = (id: string) => {
        restoreMutation.mutate(id);
    };

    // Xác nhận xóa vĩnh viễn
    const confirmHardDelete = (id: string) => {
        hardDeleteMutation.mutate(id);
    };

    // Cấu hình cột
    const columns = [
        {
            title: 'Tên danh mục',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
        },
        // {
        // title: 'Danh mục cha',
        // dataIndex: 'parentId',
        // key: 'parentId',
        // render: (parent: any) =>
        //     parent && typeof parent === 'object' ? parent.name : '-',
        // },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_: any, record: any) => (
                <Space>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn khôi phục danh mục này?"
                        onConfirm={() => confirmRestore(record._id)}
                        okText="Khôi phục"
                        cancelText="Hủy"
                    >
                        <Button type="primary" loading={restoreMutation.isPending}>
                            Khôi phục
                        </Button>
                    </Popconfirm>
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa vĩnh viễn danh mục này?"
                        onConfirm={() => confirmHardDelete(record._id)}
                        okText="Xóa vĩnh viễn"
                        cancelText="Hủy"
                    >
                        <Button danger loading={hardDeleteMutation.isPending}>
                            Xóa vĩnh viễn
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Content style={{ padding: 24, background: '#fff' }}>
            <div style={{ marginBottom: 16 }}>
                <Link to="/admin/categories">
                    <Button>Quay lại danh mục</Button>
                </Link>
            </div>

            <Table
                rowKey="_id"
                columns={columns}
                dataSource={data}
                loading={isLoading}
                locale={{ emptyText: 'Không có danh mục đã xóa' }}
            />
        </Content>
    );
};

export default DeletedCategoryManager;
