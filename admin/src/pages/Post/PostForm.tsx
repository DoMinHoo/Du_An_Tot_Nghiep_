import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Switch,
  message,
  Typography,
  Upload,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const { Title } = Typography;

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean'],
  ],
};

const PostForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      setUploading(true);
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = res.data.url;
      form.setFieldValue('coverImage', uploadedUrl);
      setImageUrl(uploadedUrl);
      message.success('Tải ảnh lên thành công!');
    } catch (err) {
      console.error(err);
      message.error('Tải ảnh thất bại');
    } finally {
      setUploading(false);
    }

    return false;
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        tags: values.tags
          ? values.tags.split(',').map((tag: string) => tag.trim())
          : [],
        authorId: '66c1e245f5172ab7fb28dfd2',
      };

      await axios.post('http://localhost:5000/api/posts', payload);
      message.success('Tạo bài viết thành công!');
      navigate('/admin/posts');
    } catch (err) {
      console.error(err);
      message.error('Lỗi khi tạo bài viết');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Title level={3}>Tạo bài viết mới</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ published: false }}
      >
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
        >
          <Input placeholder="Nhập tiêu đề bài viết" />
        </Form.Item>

        <Form.Item
          name="coverImage"
          label="Ảnh bìa"
          rules={[{ required: true, message: 'Vui lòng chọn ảnh bìa!' }]}
        >
          <>
            <Upload
              beforeUpload={handleUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                Chọn ảnh từ máy
              </Button>
            </Upload>

            {imageUrl && (
              <div style={{ marginTop: 10 }}>
                <img
                  src={`http://localhost:5000${imageUrl}`}
                  alt="cover"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 200,
                    borderRadius: 4,
                  }}
                />
              </div>
            )}
          </>
        </Form.Item>

        <Form.Item
          name="content"
          label="Nội dung"
          rules={[
            {
              required: true,
              validator: (_, value) => {
                const plain = value?.replace(/<(.|\n)*?>/g, '').trim();
                if (!plain) {
                  return Promise.reject(new Error('Vui lòng nhập nội dung!'));
                }
                return Promise.resolve();
              },
            },
          ]}
          getValueFromEvent={(content) => content}
        >
          <ReactQuill
            theme="snow"
            modules={modules}
            placeholder="Nhập nội dung bài viết..."
          />
        </Form.Item>

        <Form.Item
          name="tags"
          label="Tags"
          tooltip="Ngăn cách bằng dấu phẩy"
        >
          <Input placeholder="ví dụ: tin tức, sản phẩm" />
        </Form.Item>

        <Form.Item name="published" label="Xuất bản" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu bài viết
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default PostForm;
