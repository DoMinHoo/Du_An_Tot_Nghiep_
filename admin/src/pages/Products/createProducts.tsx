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
import { UploadOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

const AddProductPage: React.FC = () => {
  const [form] = Form.useForm();

  const handleFinish = (values: any) => {
    values.flashSale_start = values.flashSale_start?.toISOString();
    values.flashSale_end = values.flashSale_end?.toISOString();
    console.log('Gửi:', values);
    message.success('Đã thêm sản phẩm!');
    form.resetFields();
  };

  return (
    <Card title="➕ Thêm sản phẩm mới" style={{ margin: 24 }}>
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        initialValues={{ status: 'active', totalPurchased: 0 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Tên sản phẩm" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Danh mục" name="categoryId" rules={[{ required: true }]}>
              <Select placeholder="Chọn danh mục">
                <Option value="Phòng khách">Phòng khách</Option>
                <Option value="Văn phòng">Văn phòng</Option>
                <Option value="Phòng ngủ">Phòng ngủ</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Chất liệu" name="material">
              <Input />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Kích thước" name="dimensions">
              <Input />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Khối lượng (kg)" name="weight">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Trạng thái" name="status">
              <Select>
                <Option value="active">Đang bán</Option>
                <Option value="hidden">Ẩn</Option>
                <Option value="sold_out">Hết hàng</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Mô tả ngắn" name="descriptionShort" rules={[{ required: true }]}>
              <TextArea rows={2} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="Mô tả chi tiết" name="descriptionLong">
              <TextArea rows={2} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item label="Giá gốc" name="price" rules={[{ required: true }]}>
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
            <Form.Item label="Giá Flash Sale" name="flashSale_discountedPrice">
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
            <Form.Item label="Hình ảnh" name="images" valuePropName="fileList" getValueFromEvent={(e) => e.fileList}>
              <Upload listType="picture-card" beforeUpload={() => false} multiple>
                <UploadOutlined /> Tải ảnh
              </Upload>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                💾 Lưu sản phẩm
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default AddProductPage;
