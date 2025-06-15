// import React from "react";
// import {
//     Card,
//     Input,
//     Select,
//     Button,
//     Radio,
//     Form,
//     Typography,
//     Divider,
//     Row,
//     Col,
// } from "antd";

// const { Title, Text } = Typography;
// const { Option } = Select;

// const CheckoutPage: React.FC = () => {
//     return (
//         <Row gutter={0} className="p-6 bg-white" style={{ borderRadius: 8 }}>
//             {/* Left Side - Form */}
//             <Col
//                 span={14}
//                 style={{
//                     paddingRight: 24,
//                     borderRight: "1px solid #f0f0f0",
//                 }}
//             >
//                 <Title level={3}>Nội thất LIENTO</Title>
//                 <Text>Giỏ hàng / Thông tin giao hàng</Text>

//                 <Divider />

//                 <Card title="Thông tin giao hàng" bordered={false}>
//                     <Form layout="vertical">
//                         <Form.Item label="Họ tên">
//                             <Input placeholder="Nguyễn Văn A" />
//                         </Form.Item>
//                         <Form.Item label="Số điện thoại">
//                             <Input placeholder="0123456789" />
//                         </Form.Item>
//                         <Row gutter={16}>
//                             <Col span={8}>
//                                 <Form.Item label="Tỉnh/thành">
//                                     <Select placeholder="Chọn tỉnh/thành">
//                                         <Option value="hcm">Hồ Chí Minh</Option>
//                                     </Select>
//                                 </Form.Item>
//                             </Col>
//                             <Col span={8}>
//                                 <Form.Item label="Quận/huyện">
//                                     <Select placeholder="Chọn quận/huyện">
//                                         <Option value="q1">Quận 1</Option>
//                                     </Select>
//                                 </Form.Item>
//                             </Col>
//                             <Col span={8}>
//                                 <Form.Item label="Phường/xã">
//                                     <Select placeholder="Chọn phường/xã">
//                                         <Option value="px">Phường X</Option>
//                                     </Select>
//                                 </Form.Item>
//                             </Col>
//                         </Row>
//                         <Form.Item label="Địa chỉ chi tiết">
//                             <Input />
//                         </Form.Item>
//                     </Form>
//                 </Card>

//                 <Card title="Phương thức vận chuyển" className="mt-4">
//                     <div
//                         style={{
//                             border: "1px dashed #ccc",
//                             padding: 20,
//                             textAlign: "center",
//                         }}
//                     >
//                         Vui lòng chọn tỉnh / thành để hiển thị phương thức vận chuyển.
//                     </div>
//                 </Card>

//                 <Card title="Phương thức thanh toán" className="mt-4">
//                     <Radio.Group className="w-full">
//                         <Row gutter={[0, 12]}>
//                             <Col span={24}>
//                                 <Radio value="cod">Thanh toán khi nhận hàng (COD)</Radio>
//                             </Col>
//                             <Col span={24}>
//                                 <Radio value="bank">
//                                     <div>
//                                         <strong>Thanh toán chuyển khoản qua ngân hàng</strong>
//                                         <div style={{ marginLeft: 20, fontSize: 12 }}>
//                                             <p>Chủ tài khoản: ABCXYZ</p>
//                                             <p>Số tài khoản: 0123456789</p>
//                                             <p>Ngân hàng: ALO BANK</p>
//                                             <p>Nội dung chuyển khoản: Tên + SĐT đặt hàng</p>
//                                         </div>
//                                     </div>
//                                 </Radio>
//                             </Col>
//                             <Col span={24}>
//                                 <Radio value="zalopay">Ví ZaloPay</Radio>
//                             </Col>
//                             <Col span={24}>
//                                 <Radio value="momo">Ví Momo</Radio>
//                             </Col>
//                         </Row>
//                     </Radio.Group>
//                 </Card>

//                 <div className="mt-4 text-right">
//                     <Button type="default" className="mr-2">
//                         Giỏ hàng
//                     </Button>
//                     <Button type="primary">Hoàn tất đơn hàng</Button>
//                 </div>
//             </Col>

//             {/* Right Side - Cart Summary */}
//             <Col span={10} style={{ paddingLeft: 24 }}>
//                 <Card>
//                     <Row gutter={[0, 16]}>
//                         <Col span={24}>
//                             <Row>
//                                 <Col span={6}>
//                                     <img src="https://via.placeholder.com/80" alt="item" />
//                                 </Col>
//                                 <Col span={18}>
//                                     <Text strong>Combo Phòng Ăn MOHO KOSTER Màu Nâu</Text>
//                                     <p>Nâu</p>
//                                     <Text strong>7,690,000₫</Text>
//                                 </Col>
//                             </Row>
//                         </Col>

//                         <Col span={24}>
//                             <Row>
//                                 <Col span={6}>
//                                     <img src="https://via.placeholder.com/80" alt="item" />
//                                 </Col>
//                                 <Col span={18}>
//                                     <Text strong>Full Combo Phòng Khách MOHO KOSTER Màu Nâu</Text>
//                                     <p>Nâu</p>
//                                     <Text strong>11,690,000₫</Text>
//                                 </Col>
//                             </Row>
//                         </Col>

//                         <Col span={24}>
//                             <Input.Search placeholder="Mã giảm giá..." enterButton="Sử dụng" />
//                         </Col>

//                         <Col span={24}>
//                             <Divider />
//                             <Row justify="space-between">
//                                 <Text>Tạm tính:</Text>
//                                 <Text>19,380,000₫</Text>
//                             </Row>
//                             <Row justify="space-between">
//                                 <Text>Phí vận chuyển:</Text>
//                                 <Text>—</Text>
//                             </Row>
//                             <Divider />
//                             <Row justify="space-between">
//                                 <Text strong>Tổng cộng:</Text>
//                                 <Text strong style={{ fontSize: 18, color: "#ff4d4f" }}>
//                                     19,380,000₫
//                                 </Text>
//                             </Row>
//                         </Col>
//                     </Row>
//                 </Card>
//             </Col>
//         </Row>
//     );
// };

// export default CheckoutPage;
