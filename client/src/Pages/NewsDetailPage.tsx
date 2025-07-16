import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Typography, Skeleton } from 'antd';
import { useParams } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const NewsDetailPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/posts/${slug}`);
        setPost(res.data);
      } catch (err) {
        console.error('Không tìm thấy bài viết', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) return <Skeleton active />;

  if (!post) return <p>Bài viết không tồn tại.</p>;

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Title>{post.title}</Title>
      <Paragraph type="secondary">
        Đăng ngày: {new Date(post.createdAt).toLocaleDateString()}
      </Paragraph>
      <img
        src={`http://localhost:5000${post.coverImage}`}
        alt="cover"
        style={{ width: '100%', borderRadius: 8, margin: '20px 0' }}
      />
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  );
};

export default NewsDetailPage;
