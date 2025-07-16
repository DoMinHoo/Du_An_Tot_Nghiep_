import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Table, Button, Space, Popconfirm, message, Typography, Input, Image } from 'antd';

const { Title } = Typography;
const { Search } = Input;

const PostList = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/posts');
      setPosts(res.data);
      setFilteredPosts(res.data);
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi lấy danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/posts/${id}`);
      message.success('Đã xoá thành công');
      const updated = posts.filter((p) => p._id !== id);
      setPosts(updated);
      setFilteredPosts(updated);
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi xoá bài viết');
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    const filtered = posts.filter((p) =>
      p.title.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredPosts(filtered);
  };

  const columns = [
    {
      title: 'Ảnh bìa',
      dataIndex: 'coverImage',
      key: 'coverImage',
      render: (url: string) =>
        url ? (
          <Image
            src={`http://localhost:5000${url}`} // ✅ Sửa tại đây
            alt="cover"
            width={70}
            height={45}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={false}
          />
        ) : (
          'Không có'
        ),
      
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: 'Xuất bản',
      dataIndex: 'published',
      key: 'published',
      render: (published: boolean) => (published ? '✅' : '❌'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Link to={`/admin/posts/edit/${record._id}`}>
            <Button type="primary">Sửa</Button>
          </Link>
          <Popconfirm
            title="Bạn có chắc muốn xoá bài viết này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xoá"
            cancelText="Huỷ"
          >
            <Button danger>Xoá</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Space
        style={{ justifyContent: 'space-between', width: '100%', marginBottom: 20 }}
        align="center"
      >
        <Title level={3} style={{ margin: 0 }}>Danh sách bài viết</Title>
        <Link to="/admin/posts/create">
          <Button type="primary">+ Tạo bài viết</Button>
        </Link>
      </Space>

      <Search
        placeholder="Tìm bài viết theo tiêu đề..."
        enterButton
        allowClear
        style={{ marginBottom: 16 }}
        onSearch={handleSearch}
      />

      <Table
        columns={columns}
        dataSource={filteredPosts}
        rowKey="_id"
        loading={loading}
        bordered
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
};

export default PostList;
