import React, { useEffect, useMemo } from 'react';
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
  Spin,
} from 'antd';
import {
  ArrowLeftOutlined,
  UploadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getCategories,
  updateProduct,
  getProductById,
  softDeleteProduct,
} from '../../Services/products.service';
import { useNavigate, useParams } from 'react-router-dom';
import type { Category } from '../../Types/product.interface';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import './quill-custom.css'; // ✅ CSS cho ảnh căn giữa

const { TextArea } = Input;
const { Option } = Select;

const UpdateProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();

  // Kiểm tra ID hợp lệ
  if (!id) {
    message.error('Không tìm thấy ID sản phẩm!');
    setTimeout(() => navigate('/admin/products'), 2000);
    return <Spin />;
  }

  // Lấy danh sách danh mục
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // Lấy thông tin sản phẩm theo ID
  const {
    data: product,
    isLoading: isProductLoading,
    isError: isProductError,
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  });

  // Mutation để cập nhật sản phẩm
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { mutate: updateMutate, isPending } = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      message.success('Cập nhật sản phẩm thành công!');
      navigate('/admin/products');
    },
    onError: (error: any) => {
      message.error(
        `Cập nhật sản phẩm thất bại: ${
          error.response?.data?.message || error.message || 'Lỗi không xác định'
        }`
      );
    },
  });

  // Mutation để xóa sản phẩm
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
    mutationFn: softDeleteProduct,
    onSuccess: () => {
      message.success('Xóa sản phẩm thành công!');
      navigate('/admin/products');
    },
    onError: (error: any) => {
      message.error(
        `Xóa sản phẩm thất bại: ${
          error.response?.data?.message || error.message || 'Lỗi không xác định'
        }`
      );
    },
  });

  // Điền dữ liệu sản phẩm vào form
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (product) {
      form.setFieldsValue({
        name: product.name,
        brand: product.brand,
        categoryId: product.categoryId?._id || product.categoryId,
        descriptionShort: product.descriptionShort,
        descriptionLong: product.descriptionLong,
        status: product.status,
        images:
          product.image?.map((img: string, index: number) => ({
            uid: `existing-${index}`,
            name: img.split('/').pop() || `image-${index}`,
            status: 'done',
            url: img.startsWith('http') ? img : `http://localhost:5000${img}`,
          })) || [],
      });
    }
  }, [product, form]);

  // Xử lý danh sách file ảnh
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList || [];
  };

  // Xử lý khi submit form
  const handleFinish = (values: any) => {
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('brand', values.brand || '');
    formData.append('descriptionShort', values.descriptionShort);
    formData.append('descriptionLong', values.descriptionLong || '');
    formData.append('material', values.material || '');
    formData.append('categoryId', values.categoryId);
    formData.append('status', values.status);

    // Gửi ảnh mới
    if (values.images) {
      values.images.forEach((file: any) => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj);
        }
      });
    }

    // Gửi danh sách URL ảnh hiện có
    if (product?.image) {
      const existingImages = values.images
        .filter((file: any) => !file.originFileObj)
        .map((file: any) => file.url.replace('http://localhost:5000', ''));
      if (existingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }
    }

    updateMutate({ id, formData });
  };

  const quillModules = useMemo(
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
                    {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    }
                  );
                  const imageUrl = res.data.url;
                  const editor = this.quill;
                  const range = editor.getSelection(true);
                  editor.insertEmbed(
                    range.index,
                    'image',
                    `http://localhost:5000${imageUrl}`
                  );
                  editor.format('align', 'center');
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

  const quillFormats = [
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

  if (isProductError) {
    return (
      <div>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/products')}
        >
          Quay lại
        </Button>
        <Card title="Lỗi" style={{ margin: 24 }}>
          <p>Không thể tải thông tin sản phẩm. Vui lòng thử lại.</p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/admin/products')}
      >
        Quay lại
      </Button>
      <Card title="✏️ Cập nhật sản phẩm" style={{ margin: 24 }}>
        {isProductLoading ? (
          <Spin />
        ) : (
          <>
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={() => deleteMutate(id)}
              disabled={isDeleting}
              style={{ marginBottom: 16 }}
            >
              Xóa sản phẩm
            </Button>
            <Form
              layout="vertical"
              form={form}
              onFinish={handleFinish}
              disabled={isPending}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Tên sản phẩm"
                    name="name"
                    rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
                  >
                    <Input placeholder="Nhập tên sản phẩm" />
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
                      loading={isCategoriesLoading}
                      disabled={isCategoriesLoading || isCategoriesError}
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
                    <TextArea rows={2} placeholder="Nhập mô tả ngắn" />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item label="Mô tả chi tiết" name="descriptionLong">
                    <ReactQuill
                      theme="snow"
                      modules={quillModules}
                      formats={quillFormats}
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
                    <Select placeholder="Chọn trạng thái">
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
                      maxCount={5}
                    >
                      <Button icon={<UploadOutlined />}>Tải ảnh</Button>
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
                      💾 Cập nhật sản phẩm
                    </Button>
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </>
        )}
      </Card>
    </>
  );
};

export default UpdateProductPage;
