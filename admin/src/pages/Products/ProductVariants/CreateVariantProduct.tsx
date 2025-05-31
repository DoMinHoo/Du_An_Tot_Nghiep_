
import React from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  message,
} from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

const { Option } = Select;

const CreateVariant = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const productId = queryParams.get('productId');

  const [form] = Form.useForm();

  const onFinish = (values) => {
    const variantData = {
      ...values,
      productId,
    };

    console.log('Biến thể được tạo:', variantData);
    message.success('Thêm biến thể thành công!');
    navigate(`/admin/products/variants/${productId}`);
  };

  return (
    <Card
      title="➕ Thêm biến thể sản phẩm"
      style={{ maxWidth: 600, margin: 'auto' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ stock: 0, status: 'active' }}
      >
        <Form.Item label="Mã SKU" name="sku" rules={[{ required: true, message: 'Vui lòng nhập SKU' }]}>
          <Input placeholder="VD: SOFA001-BLACK-L" />
        </Form.Item>

        <Form.Item label="Màu sắc" name="color" rules={[{ required: true, message: 'Vui lòng nhập màu sắc' }]}>
          <Input placeholder="VD: Đen" />
        </Form.Item>

        <Form.Item label="Kích cỡ" name="size" rules={[{ required: true, message: 'Vui lòng nhập kích cỡ' }]}>
          <Input placeholder="VD: L" />
        </Form.Item>

        <Form.Item label="Kho hàng" name="stock" rules={[{ required: true, type: 'number', min: 0 }]}>
          <InputNumber min={0} style={{ width: '100%' }} placeholder="VD: 10" />
        </Form.Item>

        <Form.Item label="Giá bán" name="price" rules={[{ required: true, type: 'number', min: 0 }]}>
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/\₫|\s|,/g, '')}
            placeholder="VD: 13500000"
          />
        </Form.Item>

        <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]}>
          <Select>
            <Option value="active">Hiển thị</Option>
            <Option value="sold_out">Hết hàng</Option>
            <Option value="hidden">Ẩn</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Tạo biến thể
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default CreateVariant;
