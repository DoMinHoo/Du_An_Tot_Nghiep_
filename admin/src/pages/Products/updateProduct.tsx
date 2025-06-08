import React, { useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Upload,
  Button,
  Select,
  Row,
  Col,
  message,
} from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getCategories,
  updateProduct,
  getProductById,
  type Category,
} from '../../Services/products.service';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const UpdateProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();

  // Fetch categories
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // Fetch product data by ID
  const {
    data: product,
    isLoading: isProductLoading,
    isError: isProductError,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id!),
    enabled: !!id,
  });

  // Update product mutation
  const { mutate: updateMutate, isPending } = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      message.success('Cập nhật sản phẩm thành công!');
      navigate('/admin/products');
    },
    onError: () => {
      message.error('Cập nhật sản phẩm thất bại!');
    },
  });

  // Prefill form with product data
  useEffect(() => {
    if (product) {
      // Parse dimensions
      let length = 0,
        width = 0,
        height = 0;
      if (product.dimensions) {
        const matches = product.dimensions.match(
          /Dài (\d+) x Rộng (\d+) x Cao (\d+)/
        );
        if (matches) {
          length = parseInt(matches[1]);
          width = parseInt(matches[2]);
          height = parseInt(matches[3]);
        }
      }

      form.setFieldsValue({
        name: product.name,
        categoryId: product.categoryId?._id || product.categoryId, // Handle populated categoryId
        material: product.material,
        length,
        width,
        height,
        weight: product.weight,
        status: product.status,
        descriptionShort: product.descriptionShort,
        descriptionLong: product.descriptionLong,
        price: product.price,
        importPrice: product.importPrice,
        salePrice: product.salePrice,
        flashSale_discountedPrice: product.flashSale_discountedPrice,
        flashSale_start: product.flashSale_start
          ? dayjs(product.flashSale_start)
          : null,
        flashSale_end: product.flashSale_end
          ? dayjs(product.flashSale_end)
          : null,
        images:
          product.image?.map((img: string, index: number) => ({
            uid: `existing-${index}`,
            name: img.split('/').pop(),
            status: 'done',
            url: img.startsWith('http') ? img : `http://localhost:5000${img}`,
          })) || [],
      });
    }
  }, [product, form]);

  // Handle file upload
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const handleFinish = (values: any) => {
    const formData = new FormData();
    const { length, width, height, images, ...rest } = values;

    // Append dimensions
    formData.append(
      'dimensions',
      `Dài ${length} x Rộng ${width} x Cao ${height} cm`
    );

    // Append flash sale dates
    if (rest.flashSale_start) {
      formData.append('flashSale_start', rest.flashSale_start.toISOString());
    }
    if (rest.flashSale_end) {
      formData.append('flashSale_end', rest.flashSale_end.toISOString());
    }

    // Append other fields
    Object.keys(rest).forEach((key) => {
      if (rest[key] !== undefined && rest[key] !== null) {
        formData.append(key, rest[key]);
      }
    });

    // Append new images
    if (images) {
      images.forEach((file: any) => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj);
        }
      });
    }

    formData.append('id', id!);

    updateMutate(formData);
  };

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
        <Form
          layout="vertical"
          form={form}
          onFinish={handleFinish}
          disabled={isProductLoading || isProductError}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tên sản phẩm"
                name="name"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên sản phẩm' },
                ]}
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
                label="Chất liệu"
                name="material"
                rules={[{ required: true, message: 'Vui lòng nhập chất liệu' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Kích thước (cm)">
                <Input.Group compact>
                  <Form.Item
                    name="length"
                    noStyle
                    rules={[{ required: true, message: 'Nhập Dài' }]}
                  >
                    <InputNumber
                      placeholder="Dài"
                      min={0}
                      style={{ width: '33.33%' }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="width"
                    noStyle
                    rules={[{ required: true, message: 'Nhập Rộng' }]}
                  >
                    <InputNumber
                      placeholder="Rộng"
                      min={0}
                      style={{ width: '33.33%' }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="height"
                    noStyle
                    rules={[{ required: true, message: 'Nhập Cao' }]}
                  >
                    <InputNumber
                      placeholder="Cao"
                      min={0}
                      style={{ width: '33.33%' }}
                    />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Khối lượng (kg)"
                name="weight"
                rules={[
                  { required: true, message: 'Vui lòng nhập khối lượng' },
                ]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Trạng thái"
                name="status"
                rules={[
                  { required: true, message: 'Vui lòng chọn trạng thái' },
                ]}
              >
                <Select>
                  <Option value="active">Đang bán</Option>
                  <Option value="hidden">Ẩn</Option>
                  <Option value="sold_out">Hết hàng</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Mô tả ngắn"
                name="descriptionShort"
                rules={[
                  { required: true, message: 'Vui lòng nhập mô tả ngắn' },
                ]}
              >
                <TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Mô tả chi tiết" name="descriptionLong">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Giá gốc"
                name="price"
                rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} addonAfter="₫" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Giá nhập" name="importPrice">
                <InputNumber min={0} style={{ width: '100%' }} addonAfter="₫" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Giá khuyến mãi" name="salePrice">
                <InputNumber min={0} style={{ width: '100%' }} addonAfter="₫" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Giá Flash Sale"
                name="flashSale_discountedPrice"
              >
                <InputNumber min={0} style={{ width: '100%' }} addonAfter="₫" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Bắt đầu Flash Sale" name="flashSale_start">
                <DatePicker style={{ width: '100%' }} showTime />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Kết thúc Flash Sale" name="flashSale_end">
                <DatePicker style={{ width: '100%' }} showTime />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="Hình ảnh"
                name="images"
                valuePropName="fileList"
                getValueFromEvent={normFile}
                rules={[
                  { required: true, message: 'Vui lòng chọn ít nhất 1 ảnh' },
                ]}
              >
                <Upload
                  listType="picture-card"
                  beforeUpload={() => false} // Prevent auto-upload
                  multiple
                  accept="image/*"
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
      </Card>
    </>
  );
};

export default UpdateProductPage;
