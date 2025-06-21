import React, { useEffect } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  message,
  Typography,
  Space,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  GiftOutlined,
  PercentageOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { getPromotionById, updatePromotion } from '../../Services/promotion.service';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;

const UpdatePromotion: React.FC = () => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const discountType = Form.useWatch('discountType', form);

  const { data } = useQuery({
    queryKey: ['promotion', id],
    queryFn: () => getPromotionById(id as string),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (updatedData: any) => updatePromotion(id as string, updatedData),
    onSuccess: () => {
      message.success('Cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      navigate('/admin/promotions');
    },
    onError: () => {
      message.error('Cập nhật thất bại');
    },
  });

  useEffect(() => {
    if (data) {
      form.setFieldsValue({
        ...data,
        expiryDate: data.expiryDate ? dayjs(data.expiryDate) : null,
      });
    }
  }, [data, form]);

  const onFinish = (values: any) => {
    const formatted = {
      ...values,
      expiryDate: values.expiryDate ? values.expiryDate.toISOString() : null,
    };
    mutation.mutate(formatted);
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space align="center">
            <GiftOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              Chỉnh sửa Mã Khuyến Mãi
            </Title>
          </Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} size="large">
            Quay lại
          </Button>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ isActive: true }}>
          <Card
            title={
              <Space>
                <PercentageOutlined style={{ color: '#1890ff' }} />
                <span>Thông tin cơ bản</span>
              </Space>
            }
            style={{ marginBottom: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={<Text strong>Mã khuyến mãi</Text>}
                  name="code"
                  rules={[{ required: true, message: 'Vui lòng nhập mã' }]}
                >
                  <Input placeholder="VD: SUMMER2025" size="large" style={{ borderRadius: '6px' }} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={<Text strong>Loại giảm giá</Text>}
                  name="discountType"
                  rules={[{ required: true, message: 'Chọn loại giảm' }]}
                >
                  <Select placeholder="Chọn loại giảm giá" size="large" style={{ borderRadius: '6px' }}>
                    <Option value="percentage">
                      <Space>
                        <PercentageOutlined />
                        Phần trăm (%)
                      </Space>
                    </Option>
                    <Option value="fixed">
                      <Space>
                        <span>₫</span>
                        Cố định (VNĐ)
                      </Space>
                    </Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <Text strong>Giá trị giảm</Text>
                      {discountType === 'percentage' && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          (0-100%)
                        </Text>
                      )}
                    </Space>
                  }
                  name="discountValue"
                  rules={[
                    { required: true, message: 'Nhập giá trị giảm' },
                    {
                      validator: (_, value) => {
                        if (value === undefined) return Promise.resolve();
                        if (discountType === 'percentage') {
                          if (value < 0 || value > 100) return Promise.reject(new Error('Giảm phần trăm phải từ 0 đến 100'));
                        }
                        if (value < 0) return Promise.reject(new Error('Giá trị giảm không hợp lệ'));
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    size="large"
                    style={{ width: '100%', borderRadius: '6px' }}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value: any) => value.replace(/,/g, '')}
                    placeholder={discountType === 'percentage' ? 'Nhập %' : 'Nhập số tiền'}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label={<Text strong>Giá trị đơn tối thiểu</Text>} name="minOrderValue">
                  <InputNumber
                    min={0}
                    size="large"
                    style={{ width: '100%', borderRadius: '6px' }}
                    placeholder="0 nếu không yêu cầu"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value: any) => value.replace(/,/g, '')}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <Space>
                <CalendarOutlined style={{ color: '#52c41a' }} />
                <span>Cài đặt nâng cao</span>
              </Space>
            }
            style={{ marginBottom: '24px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <UserOutlined />
                      <Text strong>Giới hạn lượt sử dụng</Text>
                    </Space>
                  }
                  name="usageLimit"
                >
                  <InputNumber
                    min={0}
                    size="large"
                    style={{ width: '100%', borderRadius: '6px' }}
                    placeholder="0 nếu không giới hạn"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <Space>
                      <CalendarOutlined />
                      <Text strong>Ngày hết hạn</Text>
                    </Space>
                  }
                  name="expiryDate"
                >
                  <DatePicker
                    size="large"
                    style={{ width: '100%', borderRadius: '6px' }}
                    format="DD/MM/YYYY HH:mm"
                    showTime={{ format: 'HH:mm' }}
                    placeholder="Chọn ngày hết hạn"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            <Row>
              <Col span={24}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: '#fafafa',
                    borderRadius: '6px',
                    border: '1px solid #f0f0f0',
                  }}
                >
                  <div>
                    <Text strong>Trạng thái kích hoạt</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Mã khuyến mãi sẽ {Form.useWatch('isActive', form) ? 'được kích hoạt ngay' : 'ở trạng thái tạm dừng'}
                    </Text>
                  </div>
                  <Form.Item name="isActive" valuePropName="checked" style={{ margin: 0 }}>
                    <Switch size="default" />
                  </Form.Item>
                </div>
              </Col>
            </Row>
          </Card>

          <Card style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button size="large" onClick={() => navigate(-1)}>
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={mutation.isPending}
                icon={<GiftOutlined />}
                style={{ borderRadius: '6px' }}
              >
                {mutation.isPending ? 'Đang cập nhật...' : 'Cập nhật mã khuyến mãi'}
              </Button>
            </div>
          </Card>
        </Form>
      </div>
    </div>
  );
};

export default UpdatePromotion;