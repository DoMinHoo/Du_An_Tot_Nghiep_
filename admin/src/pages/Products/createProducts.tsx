import React, { useState, useMemo } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Upload,
  Row,
  Col,
  message,
} from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createProduct, getCategories } from '../../Services/products.service';
import { useNavigate } from 'react-router-dom';
import type { Category } from '../../Types/product.interface';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import './quill-custom.css'; // 👈 CSS để căn giữa ảnh trong editor

const { TextArea } = Input;
const { Option } = Select;

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const {
    data: categories,
    isLoading,
    isError,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { mutate: createMutate, isPending } = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      message.success('Đã thêm sản phẩm!');
      form.resetFields();
      navigate('/admin/products');
    },
    onError: () => {
      message.error('Thêm sản phẩm thất bại!');
    },
  });

  const normFile = (e: any) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  const handleFinish = (values: any) => {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('brand', values.brand || '');
    formData.append('descriptionShort', values.descriptionShort);
    formData.append('descriptionLong', values.descriptionLong || '');
    formData.append('categoryId', values.categoryId);
    formData.append('status', values.status);

    if (values.images) {
      values.images.forEach((file: any) => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj);
        }
      });
    }

    createMutate(formData);
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ font: [] }],
          [{ size: ['small', false, 'large', 'huge'] }],
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: {
          image: async function () {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();

            input.onchange = async () => {
              const file = input.files?.[0];
              if (file) {
                const formData = new FormData();
                formData.append('image', file);

                try {
                  const res = await axios.post(
                    'http://localhost:5000/api/upload',
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data' } }
                  );

                  const imageUrl = res.data.url;
                  const editor = this.quill;
                  const range = editor.getSelection(true);

                  editor.insertEmbed(range.index, 'image', `http://localhost:5000${imageUrl}`);
                  // Tìm ảnh mới vừa chèn và căn giữa
                  setTimeout(() => {
                    const images = document.querySelectorAll('.ql-editor img');
                    const lastImage = images[images.length - 1];
                    if (lastImage) {
                      lastImage.setAttribute('style', 'display: block; margin: 0 auto;');
                    }
                  }, 100);

                  editor.setSelection(range.index + 1);
                } catch (error) {
                  console.error('Lỗi upload ảnh:', error);
                  message.error('Tải ảnh thất bại!');
                }
              }
            };
          },
        },
      },
    }),
    []
  );

  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'align',
    'color',
    'background',
    'list',
    'bullet',
    'link',
    'image',
  ];

  return (
    <>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/admin/products')}
      >
        Quay lại
      </Button>
      <Card title="➕ Thêm sản phẩm mới" style={{ margin: 24 }}>
        <Form
          layout="vertical"
          form={form}
          onFinish={handleFinish}
          initialValues={{ status: 'active', totalPurchased: 0 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tên sản phẩm"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Danh mục"
                name="categoryId"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
              >
                <Select
                  placeholder="Chọn danh mục"
                  loading={isLoading}
                  disabled={isLoading || isError}
                >
                  {categories?.map((category) => (
                    <Option key={category._id} value={category._id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Mô tả ngắn"
                name="descriptionShort"
                rules={[{ required: true, message: 'Vui lòng nhập mô tả ngắn' }]}
              >
                <TextArea rows={2} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Mô tả chi tiết"
                name="descriptionLong"
              >
                <ReactQuill
                  theme="snow"
                  modules={modules}
                  formats={formats}
                  placeholder="Nhập mô tả chi tiết sản phẩm..."
                  style={{ height: '300px' }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Trạng thái"
                name="status"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select>
                  <Option value="active">Đang bán</Option>
                  <Option value="hidden">Ẩn</Option>
                  <Option value="sold_out">Hết hàng</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Hình ảnh"
                name="images"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 ảnh' }]}
              >
                <Upload
                  listType="picture-card"
                  beforeUpload={() => false}
                  accept="image/*"
                  multiple
                  maxCount={10}
                >
                  <UploadOutlined /> Tải ảnh
                </Upload>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  style={{ width: '100%' }}
                  loading={isPending}
                >
                  💾 Lưu sản phẩm
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </>
  );
};

export default AddProductPage;
