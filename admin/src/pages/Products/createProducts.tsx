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
  Table,
  Popconfirm,
  Space,
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
import VariationModal from '../../components/Layout/VariantModel';
import type { ProductVariationFormData } from '../../Types/productVariant.interface';
import { toast } from 'react-toastify';

const { TextArea } = Input;
const { Option } = Select;

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // BIến thể để quản lý modal
  const [variations, setVariations] = useState<ProductVariationFormData[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVariation, setEditingVariation] = useState<ProductVariationFormData | undefined>(undefined);

  const handleAddVariation = () => {
    setEditingVariation(undefined);
    setIsModalVisible(true);
  };

  const handleSaveVariation = (variation: ProductVariationFormData) => {
    if (editingVariation) {
      setVariations(prev =>
        prev.map(v => (v === editingVariation ? variation : v))
      );
    } else {
      setVariations(prev => [...prev, variation]);
    }
    setIsModalVisible(false);
  };

  const handleEditVariation = (variation: ProductVariationFormData) => {
    setEditingVariation(variation);
    setIsModalVisible(true);
  };

  const handleDeleteVariation = (variation: ProductVariationFormData) => {
    setVariations(prev => prev.filter(v => v !== variation));
  };


  // Lấy danh sách danh mục từ API
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
    onError: (error: any) => {
      if (error?.response?.data?.field && error?.response?.data?.message) {
        // Hiển thị lỗi tại trường cụ thể
        form.setFields([
          {
            name: error.response.data.field,
            errors: [error.response.data.message],
          },
        ]);
      } else {
        message.error(error?.response?.data?.message || 'Thêm sản phẩm thất bại!');
      }
    },
  });

  const normFile = (e: any) => {
    if (Array.isArray(e)) return e;
    return e?.fileList;
  };

  // helper upload single file -> return url string (backend needs to return url)
  const uploadSingleFile = async (file: File) => {
    const fd = new FormData();
    fd.append("image", file); // backend multer expects 'image' (adjust if different)
    const res = await axios.post("http://localhost:5000/api/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // adapt to your backend response shape
    // expecting res.data.url or res.data.data.url
    return res.data.url ?? res.data.data?.url ?? res.data;
  };

  const handleFinish = async (values: any) => {
    const varNames = variations.map(v => (v.name || '').trim().toLowerCase());
    const dupVarNames = varNames.filter((n, i) => varNames.indexOf(n) !== i);
    if (dupVarNames.length) {
      return message.error(`Tên biến thể bị trùng: ${[...new Set(dupVarNames)].join(', ')}`);
    }

    // 2. check duplicate color names
    const colorNames = variations.map(v => (v.colorName || '').trim().toLowerCase());
    const dupColorNames = colorNames.filter((n, i) => colorNames.indexOf(n) !== i);
    if (dupColorNames.length) {
      return message.error(`Tên màu bị trùng trong biến thể: ${[...new Set(dupColorNames)].join(', ')}`);
    }

    // 3. check duplicate skus in payload
    const skus = variations.map(v => (v.sku || '').trim()).filter(Boolean);
    const dupSkus = skus.filter((s, i) => skus.indexOf(s) !== i);
    if (dupSkus.length) {
      return message.error(`SKU bị trùng trong biến thể: ${[...new Set(dupSkus)].join(', ')}`);
    }
    try {
      // upload all variation images and build final variations array
      const variationsToSend = await Promise.all(variations.map(async (v) => {
        const copy: any = { ...v };
        // ensure material key name matches backend model field 'material'
        copy.material = copy.materialVariation; // rename property for backend
        delete copy.materialVariation;

        if ((v as any).colorImageFile) {
          const url = await uploadSingleFile((v as any).colorImageFile);
          copy.colorImageUrl = url;
          delete copy.colorImageFile;
        } else {
          // if there was an existing colorImageUrl already (preview), keep it
          copy.colorImageUrl = v.colorImageUrl || "";
        }
        return copy;
      }));

      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("brand", values.brand || "");
      formData.append("descriptionShort", values.descriptionShort || "");
      formData.append("descriptionLong", values.descriptionLong || "");
      formData.append("categoryId", values.categoryId);
      formData.append("status", values.status || "active");

      // append product images
      if (values.images) {
        values.images.forEach((file: any) => {
          if (file.originFileObj) formData.append("images", file.originFileObj);
        });
      }

      // append variations JSON (now each variation has colorImageUrl string and material is _id)
      formData.append("variations", JSON.stringify(variationsToSend));

      // call createProduct (your service expects FormData)
      createMutate(formData);
    } catch (err) {
      console.error(err);
      message.error("Lỗi khi tạo sản phẩm");
    }
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
          <Row gutter={30}>
            <Col span={24}>
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
                  style={{ height: '200px', marginBottom: '66px' }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
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
              <Button type="dashed" onClick={handleAddVariation} style={{ marginBottom: 16 }}>
                ➕ Thêm biến thể
              </Button>

              <Table
                dataSource={variations}
                rowKey={(record, index) => (index ?? 0).toString()}
                columns={[

                  { title: 'Tên', dataIndex: 'name' },
                  { title: 'Chất liệu', dataIndex: 'material.name', render: (text, record) => record.material?.name || 'Không có' },
                  { title: 'Giá', dataIndex: 'finalPrice' },
                  { title: 'Tồn kho', dataIndex: 'stockQuantity' },
                  { title: 'Ảnh', dataIndex: 'colorImageUrl' },
                  {
                    title: 'Hành động',
                    render: (_, record) => (
                      <Space>
                        <Button type="link" onClick={() => handleEditVariation(record)}>Sửa</Button>
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
