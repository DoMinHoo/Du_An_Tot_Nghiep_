// EditPost.tsx
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Form,
  Input,
  Button,
  Switch,
  Upload,
  Typography,
  message,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageUploader from 'quill-image-uploader';

Quill.register('modules/imageUploader', ImageUploader);

const { Title } = Typography;

const EditPost = () => {
  const [form] = Form.useForm();
  const { id } = useParams();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [content, setContent] = useState('');
  const [contentError, setContentError] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/posts/id/${id}`);
        const post = res.data;
        form.setFieldsValue({
          ...post,
          tags: post.tags?.join(', '),
        });
        setCoverImageUrl(post.coverImage);
        setContent(post.content || '');
      } catch (err) {
        console.error(err);
        message.error('Không thể tải bài viết');
      }
    };
    fetchPost();
  }, [id, form]);

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      [{ align: [] }, { color: [] }, { background: [] }],
      ['clean'],
    ],
    imageUploader: {
      upload: async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await axios.post('http://localhost:5000/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return `http://localhost:5000${res.data.url}`;
      },
    },
  }), []);

  const handleUploadCover = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = res.data.url;
      form.setFieldValue('coverImage', imageUrl);
      setCoverImageUrl(imageUrl);
      message.success('Tải ảnh bìa thành công');
    } catch (err) {
      console.error(err);
      message.error('Tải ảnh bìa thất bại');
    } finally {
      setUploading(false);
    }

    return false;
  };

  const onFinish = async (values: any) => {
    const cleanedContent = content?.trim();
    if (!cleanedContent || cleanedContent === '<p><br></p>') {
      setContentError(true);
      message.warning('Vui lòng nhập nội dung!');
      return;
    }

    try {
      const payload = {
        ...values,
        content: cleanedContent,
        tags: values.tags?.split(',').map((tag: string) => tag.trim()) || [],
      };

      await axios.put(`http://localhost:5000/api/posts/${id}`, payload);
      message.success('Cập nhật bài viết thành công');
      navigate('/admin/posts');
    } catch (err) {
      console.error(err);
      message.error('Lỗi cập nhật bài viết');
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Title level={3}>Chỉnh sửa bài viết</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ published: false }}
      >
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
        >
          <Input placeholder="Nhập tiêu đề" />
        </Form.Item>

        <Form.Item label="Ảnh bìa" required>
          <Upload
            beforeUpload={handleUploadCover}
            showUploadList={false}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              Chọn ảnh bìa mới
            </Button>
          </Upload>
          {coverImageUrl && (
            <div style={{ marginTop: 10 }}>
              <img
                src={`http://localhost:5000${coverImageUrl}`}
                alt="cover"
                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }}
              />
            </div>
          )}
        </Form.Item>

        <Form.Item
          name="coverImage"
          hidden
          rules={[{ required: true, message: 'Bắt buộc có ảnh bìa' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Nội dung" required>
          <div
            style={{
              border: contentError ? '1px solid red' : '1px solid #d9d9d9',
              borderRadius: 6,
              padding: 4,
              minHeight: 100,
            }}
          >
            <ReactQuill
              ref={quillRef}
              value={content}
              onChange={(val) => {
                setContent(val);
                setContentError(false);
              }}
              theme="snow"
              modules={modules}
              placeholder="Nhập nội dung bài viết..."
            />
          </div>
          {contentError && (
            <div style={{ color: 'red', marginTop: 4 }}>
              Nội dung không được để trống.
            </div>
          )}
        </Form.Item>

        <Form.Item name="tags" label="Tags" tooltip="Ngăn cách bằng dấu phẩy">
          <Input placeholder="ví dụ: tin tức, sản phẩm" />
        </Form.Item>

        <Form.Item name="published" label="Xuất bản" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Lưu thay đổi
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default EditPost;
