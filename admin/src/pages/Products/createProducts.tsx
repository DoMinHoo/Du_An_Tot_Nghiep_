import React from 'react';
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
import { createProduct, getCategories, type Category } from '../../Services/products.service';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;
const { Option } = Select;

const AddProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { data: categories, isLoading, isError } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const { mutate: createMutate, isPending } = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      message.success('Đã thêm sản phẩm!');
      form.resetFields();
      navigate("/admin/products");
    },
    onError: () => {
      message.error('Thêm sản phẩm thất bại!');
    },
  });

  const handleFinish = (values: any) => {
    const { length, width, height } = values;
    values.dimensions = `Dài ${length} x Rộng ${width} x Cao ${height} cm`;
    values.flashSale_start = values.flashSale_start?.toISOString();
    values.flashSale_end = values.flashSale_end?.toISOString();

    createMutate(values);
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
    <Card title="➕ Thêm sản phẩm mới" style={{ margin: 24 }}>
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        initialValues={{ status: 'active', totalPurchased: 0 }}
      >
        <Row gutter={16}>
          {/* Tên sản phẩm */}
          <Col span={12}>
            <Form.Item
              label="Tên sản phẩm"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
            >
              <Input />
            </Form.Item>
          </Col>

          {/* Danh mục */}
          <Col span={12}>
            <Form.Item
              label="Danh mục"
              name="categoryId"
              rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
            >
              <Select placeholder="Chọn danh mục" loading={isLoading} disabled={isLoading || isError}>
                {categories?.map(category => (
                  <Option key={category._id} value={category._id}>
                    {category.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Chất liệu */}
          <Col span={12}>
            <Form.Item
              label="Chất liệu"
              name="material"
              rules={[{ required: true, message: 'Vui lòng nhập chất liệu' }]}
            >
              <Input />
            </Form.Item>
          </Col>

          {/* Kích thước (Dài x Rộng x Cao) */}
          <Col span={12}>
            <Form.Item label="Kích thước (cm)">
              <Input.Group compact>
                <Form.Item
                  name="length"
                  noStyle
                  rules={[{ required: true, message: 'Nhập Dài' }]}
                >
                  <InputNumber placeholder="Dài" min={0} style={{ width: '33.33%' }} />
                </Form.Item>
                <Form.Item
                  name="width"
                  noStyle
                  rules={[{ required: true, message: 'Nhập Rộng' }]}
                >
                  <InputNumber placeholder="Rộng" min={0} style={{ width: '33.33%' }} />
                </Form.Item>
                <Form.Item
                  name="height"
                  noStyle
                  rules={[{ required: true, message: 'Nhập Cao' }]}
                >
                  <InputNumber placeholder="Cao" min={0} style={{ width: '33.33%' }} />
                </Form.Item>
              </Input.Group>
            </Form.Item>
          </Col>

          {/* Khối lượng */}
          <Col span={8}>
            <Form.Item
              label="Khối lượng (kg)"
              name="weight"
              rules={[{ required: true, message: 'Vui lòng nhập khối lượng' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          {/* Trạng thái */}
          <Col span={8}>
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

          {/* Mô tả ngắn */}
          <Col span={12}>
            <Form.Item
              label="Mô tả ngắn"
              name="descriptionShort"
              rules={[{ required: true, message: 'Vui lòng nhập mô tả ngắn' }]}
            >
              <TextArea rows={2} />
            </Form.Item>
          </Col>

          {/* Mô tả chi tiết */}
          <Col span={12}>
            <Form.Item label="Mô tả chi tiết" name="descriptionLong">
              <TextArea rows={2} />
            </Form.Item>
          </Col>

          {/* Giá gốc */}
          <Col span={8}>
            <Form.Item
              label="Giá gốc"
              name="price"
              rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} addonAfter="₫" />
            </Form.Item>
          </Col>

          {/* Giá nhập */}
          <Col span={8}>
            <Form.Item label="Giá nhập" name="importPrice">
              <InputNumber min={0} style={{ width: '100%' }} addonAfter="₫" />
            </Form.Item>
          </Col>

          {/* Giá khuyến mãi */}
          <Col span={8}>
            <Form.Item label="Giá khuyến mãi" name="salePrice">
              <InputNumber min={0} style={{ width: '100%' }} addonAfter="₫" />
            </Form.Item>
          </Col>

          {/* Giá Flash Sale */}
          <Col span={8}>
            <Form.Item label="Giá Flash Sale" name="flashSale_discountedPrice">
              <InputNumber min={0} style={{ width: '100%' }} addonAfter="₫" />
            </Form.Item>
          </Col>

          {/* Bắt đầu Flash Sale */}
          <Col span={8}>
            <Form.Item label="Bắt đầu Flash Sale" name="flashSale_start">
              <DatePicker style={{ width: '100%' }} showTime />
            </Form.Item>
          </Col>

          {/* Kết thúc Flash Sale */}
          <Col span={8}>
            <Form.Item label="Kết thúc Flash Sale" name="flashSale_end">
              <DatePicker style={{ width: '100%' }} showTime />
            </Form.Item>
          </Col>

          {/* Hình ảnh */}
          <Col span={24}>
            <Form.Item
              label="Hình ảnh"
              name="images"
              valuePropName="fileList"
              getValueFromEvent={(e) => e?.fileList}
              rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 ảnh' }]}
            >
              <Upload listType="picture-card" beforeUpload={() => false} multiple>
                <UploadOutlined /> Tải ảnh
              </Upload>
            </Form.Item>
          </Col>

          {/* Nút Lưu */}
          <Col span={24}>
            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={isPending}>
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
