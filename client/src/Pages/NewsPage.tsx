import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Skeleton, Row, Col } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

interface Post {
  _id: string;
  title: string;
  slug: string;
  coverImage: string;
  content: string;
  createdAt: string;
}

// Hàm loại bỏ HTML và rút gọn nội dung
const stripHtml = (html: string, maxLength = 120) => {
  const div = document.createElement('div');
  div.innerHTML = html;
  const text = div.textContent || div.innerText || '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const NewsPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/posts');
        const publishedPosts = res.data.filter((post: Post) => post.published);
        setPosts(publishedPosts.reverse());
      } catch (err) {
        console.error('Lỗi khi tải bài viết', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>
        Tin tức mới nhất
      </Title>

      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <Row gutter={[24, 32]}>
          {posts.map((post) => (
            <Col key={post._id} xs={24} sm={12} md={8}>
              <div style={{ height: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    background: '#fff',
                    borderRadius: 8,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    padding: 12,
                    transition: 'all 0.3s',
                  }}
                >
                  <Link to={`/news/${post.slug}`}>
                    <img
                      src={`http://localhost:5000${post.coverImage}`}
                      alt={post.title}
                      style={{
                        width: '100%',
                        height: 180,
                        objectFit: 'cover',
                        borderRadius: 6,
                        marginBottom: 12,
                      }}
                    />
                  </Link>
                  <Title level={5} style={{ marginBottom: 8 }}>
                    <Link to={`/news/${post.slug}`} style={{ color: '#000' }}>
                      {post.title}
                    </Link>
                  </Title>
                  <Paragraph
                    style={{
                      fontSize: 14,
                      lineHeight: '22px',
                      marginBottom: 12,
                      flexGrow: 1,
                    }}
                  >
                    {stripHtml(post.content)}
                  </Paragraph>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      marginTop: 'auto',
                    }}
                  >
                    <Text type="secondary">
                      {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                    <Link to={`/news/${post.slug}`}>Xem thêm »</Link>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default NewsPage;
