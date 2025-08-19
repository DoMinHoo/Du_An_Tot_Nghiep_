import React, { useState, useEffect, useMemo } from 'react';
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
  Table,
  Popconfirm,
  Space,
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
import type { Category, Product } from '../../Types/product.interface';
import type { ProductVariation, ProductVariationFormData } from '../../Types/productVariant.interface';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import './quill-custom.css';
import VariationModal from '../../components/Layout/VariantModel';

const { TextArea } = Input;
const { Option } = Select;

const UpdateProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [variations, setVariations] = useState<ProductVariationFormData[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVariation, setEditingVariation] = useState<ProductVariationFormData | undefined>(undefined);

  if (!id) {
    message.error('Không tìm thấy ID sản phẩm!');
    setTimeout(() => navigate('/admin/products'), 2000);
    return <Spin />;
  }

  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const {
    data: product,
    isLoading: isProductLoading,
    isError: isProductError,
    error,
  } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: () => getProductById(id),
    enabled: !!id,
  });

  const { mutate: updateMutate, isPending } = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      message.success('Cập nhật sản phẩm thành công!');
      navigate('/admin/products');
    },
    onError: (error: any) => {
      message.error(
        `Cập nhật sản phẩm thất bại: ${error.response?.data?.message || error.message || 'Lỗi không xác định'}`
      );
    },
  });

  const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
    mutationFn: softDeleteProduct,
    onSuccess: () => {
      message.success('Xóa sản phẩm thành công!');
      navigate('/admin/products');
    },
    onError: (error: any) => {
      message.error(
        `Xóa sản phẩm thất bại: ${error.response?.data?.message || error.message || 'Lỗi không xác định'}`
      );
    },
  });

  useEffect(() => {
    if (product) {
      console.log('Product data:', product);
      form.setFieldsValue({
        name: product.name,
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
      const productVariations = Array.isArray(product.variations) ? product.variations : [];
      console.log('Variations data:', productVariations);
      setVariations(
        productVariations.map((v: ProductVariation) => ({
          _id: v._id,
          _cid: v._id,
          name: v.name || '',
          sku: v.sku || '',
          dimensions: v.dimensions || '',
          basePrice: v.basePrice || 0,
          priceAdjustment: v.priceAdjustment || 0,
          finalPrice: v.finalPrice || 0,
          salePrice: v.salePrice || null,
          stockQuantity: v.stockQuantity || v.stockQuantity || 0, // Handle possible mismatch
          colorName: v.colorName || '',
          colorHexCode: v.colorHexCode || '',
          colorImageUrl: v.colorImageUrl || '',
          materialVariation: v.material?._id || '',
        }))
      );
    } else if (isProductError) {
      console.error('Error fetching product:', error);
    }
  }, [product, form, isProductError, error]);
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList || [];
  };

  const handleAddVariation = () => {
    setEditingVariation(undefined);
    setIsModalVisible(true);
  };

  const toImageSrc = (u?: string) => {
    if (!u) return '';
    if (/^(https?:|blob:|data:)/i.test(u)) return u; // đã là URL tuyệt đối
    return `http://localhost:5000${u}`;             // đường dẫn tương đối từ server
  };

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const makeCid = () =>
    `cid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const handleSaveVariation = (variation: ProductVariationFormData) => {
    if (editingVariation?._id) {
      setVariations(prev =>
        prev.map(v => (v._id === editingVariation._id ? { ...variation, _id: editingVariation._id } : v))
      );
    } else {
      setVariations(prev => [...prev, { ...variation }]);
    }
    setIsModalVisible(false);
  };

  const handleEditVariation = (variation: ProductVariationFormData) => {
    setEditingVariation(variation);
    setIsModalVisible(true);
  };

  const handleDeleteVariation = (variation: ProductVariationFormData) => {
    if (variation._id) {
      setDeletedIds(prev => [...prev, variation._id!]);
    }
    setVariations(prev => prev.filter(v => v._id !== variation._id));
  };

  const handleFinish = async (values: any) => {
    try {
      // Upload variation images if any
      const updatedVariations = await Promise.all(
        variations.map(async (variation) => {
          if (variation.colorImageFile) {
            const imageFormData = new FormData();
            imageFormData.append('image', variation.colorImageFile);
            const res = await axios.post('http://localhost:5000/api/upload', imageFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            const serverUrl = res.data.url; // Assuming { url: '/uploads/...' }
            return { ...variation, colorImageUrl: serverUrl, colorImageFile: undefined };
          }
          return variation;
        })
      );

      const formData = new FormData();
      formData.append('name', values.name);
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

      if (product?.image) {
        const existingImages = values.images
          .filter((file: any) => !file.originFileObj)
          .map((file: any) => file.url.replace('http://localhost:5000', ''));
        if (existingImages.length > 0) {
          formData.append('existingImages', JSON.stringify(existingImages));
        }
      }

      // Append variations (with server URLs) and deleted variations
      formData.append('variations', JSON.stringify(updatedVariations.map(({ colorImageFile, ...rest }) => rest)));
      if (deletedIds.length > 0) {
        formData.append('deletedVariations', JSON.stringify(deletedIds));
      }

      updateMutate({ id, formData });
    } catch (error) {
      console.error('Lỗi khi upload ảnh biến thể:', error);
      message.error('Không thể upload ảnh biến thể. Vui lòng thử lại.');
    }
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
          <p>Không thể tải thông tin sản phẩm. Vui lòng thử lại. Error: {error?.message}</p>
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
                      style={{ height: '300px', marginBottom: '50px' }}
                    />
                  </Form.Item>
                </Col>

                <Col span={24}>
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
                      maxCount={20}
                    >
                      <Button icon={<UploadOutlined />}>Tải ảnh</Button>
                    </Upload>
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Button type="dashed" onClick={handleAddVariation} style={{ marginBottom: 16 }}>
                    ➕ Thêm biến thể
                  </Button>

                  <Table
                    dataSource={variations}
                    rowKey={(record) => record._id || record._cid}
                    columns={[
                      {
                        title: 'Ảnh',
                        dataIndex: 'colorImageUrl',
                        render: (url: string) =>
                          url ? (
                            <img
                              src={toImageSrc(url)}
                              alt="Variant"
                              style={{ width: 70, height: 70, objectFit: 'cover' }}
                            />
                          ) : <span>Không có ảnh</span>
                      },
                      { title: 'Tên', dataIndex: 'name' },
                      { title: 'Kích thước', dataIndex: 'dimensions' },
                      { title: 'Giá gốc', dataIndex: 'basePrice', render: (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') },
                      { title: 'Giá cuối', dataIndex: 'salePrice', render: (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') },
                      { title: 'Tồn kho', dataIndex: 'stockQuantity' },
                      { title: 'Màu', dataIndex: 'colorName' },
                      {
                        title: 'Hành động',
                        render: (_, record) => (
                          <Space>
                            <Button type="link" onClick={() => handleEditVariation(record)}>
                              Sửa
                            </Button>
                            <Popconfirm title="Xóa?" onConfirm={() => handleDeleteVariation(record)}>
                              <Button type="link" danger>Xóa</Button>
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />

                  <VariationModal
                    visible={isModalVisible}
                    onCancel={() => setIsModalVisible(false)}
                    onSave={handleSaveVariation}
                    data={editingVariation}
                  />
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