import React from 'react';
import { Button, Layout, Popconfirm, Space, Table, message } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deleteCategory,
  getCategories,
} from '../../Services/categories.service';
import { Link, useNavigate } from 'react-router-dom';

const { Content } = Layout;

const CategoryManager: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Lấy danh sách danh mục (chưa xóa mềm)
  const { data = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // Mutation xóa mềm danh mục
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      message.success('Xóa mềm danh mục thành công');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (error: any) => {
      message.error(
        error?.response?.data?.message || 'Xóa mềm danh mục thất bại'
      );
    },
  });

  // Xác nhận xóa mềm
  const confirmDelete = (id: string) => {
    deleteMutation.mutate(id);
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
    //   title: 'Danh mục cha',
    //   dataIndex: 'parentId',
    //   key: 'parentId',
    //   render: (parent: any) =>
    //     parent && typeof parent === 'object' ? parent.name : '-',
    // },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            onClick={() => navigate(`/admin/categories/edit/${record._id}`)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa mềm danh mục này?"
            onConfirm={() => confirmDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button danger loading={deleteMutation.isPending}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Content style={{ padding: 24, background: '#fff' }}>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Link to="/admin/categories/create">
            <Button type="primary">Thêm danh mục</Button>
          </Link>
          <Link to="/admin/categories/deleted">
            <Button>Xem danh mục đã xóa</Button>
          </Link>
        </Space>
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={data}
        loading={isLoading}
      />
    </Content>
  );
};

export default CategoryManager;
