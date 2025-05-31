// src/pages/variants/EditVariant.jsx
import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  message,
  Spin,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

const { Option } = Select;

// Giả lập dữ liệu
const mockVariantById = {
  '1': {
    sku: 'SOFA001-BLACK',
    color: 'Đen',
    size: 'L',
    stock: 10,
    price: 13500000,
    status: 'active',
  },
  '2': {
    sku: 'SOFA001-WHITE',
    color: 'Trắng',
    size: 'M',
    stock: 0,
    price: 13000000,
    status: 'sold_out',
  },
};

const EditVariant = () => {
  const { variantId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Giả lập fetch API
    const timeout = setTimeout(() => {
      const variantData = mockVariantById[variantId];
      if (variantData) {
        form.setFieldsValue(variantData);
        setNotFound(false);
      } else {
        setNotFound(true);
        message.error('Không tìm thấy biến thể!');
      }
      setLoading(false);
    }, 500); // Giả lập delay

    return () => clearTimeout(timeout);
  }, [variantId, form]);

  const onFinish = (values) => {
    console.log('Cập nhật biến thể:', values);
    message.success('Cập nhật thành công!');
    navigate(-1); // Quay lại trang trước
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (notFound) {
    return (
      <Card style={{ maxWidth: 600, margin: 'auto', textAlign: 'center' }}>
        <p>❌ Không tìm thấy dữ liệu biến thể.</p>
        <Button type="primary" onClick={() => navigate('/admin/products')}>
          Quay lại danh sách sản phẩm
        </Button>
      </Card>
    );
  }

  return (
    <Card
      title="✏️ Chỉnh sửa biến thể sản phẩm"
      style={{ maxWidth: 600, margin: 'auto' }}
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={onFinish}
      >
        <Form.Item label="Mã SKU" name="sku" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Màu sắc" name="color" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Kích cỡ" name="size" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item label="Kho hàng" name="stock" rules={[{ required: true, type: 'number', min: 0 }]}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>

        <Form.Item label="Giá bán" name="price" rules={[{ required: true, type: 'number', min: 0 }]}>
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/\₫|\s|,/g, '')}
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
            Cập nhật
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EditVariant;
