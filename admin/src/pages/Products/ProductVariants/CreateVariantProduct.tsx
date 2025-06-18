"use client"

import { ArrowLeftOutlined, UploadOutlined, InfoCircleOutlined } from "@ant-design/icons"
import { useMutation } from "@tanstack/react-query"
import { Button, Card, Col, Form, Input, InputNumber, message, Row, Upload, Space, Typography, Tooltip, Select } from "antd"
import type React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { createVariation } from "../../../Services/productVariation.Service"
import { useEffect, useState } from "react"
import { PlusOutlined } from "@ant-design/icons";

import { getMaterials } from "../../../Services/materials.service";

const { Option } = Select;

const { Title, Text } = Typography

const CreateProductVariationPage: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id: productId } = useParams()

  // State to hold material options for the select dropdown
  const [materialOptions, setMaterialOptions] = useState<{ value: string; label: string }[]>([]);
  const [materialLoading, setMaterialLoading] = useState<boolean>(false);
  const fetchMaterialsForSelect = async () => {
    setMaterialLoading(true);
    try {
      const res = await getMaterials(); // Lấy trang đầu tiên là đủ
      const options = res.data.map((item) => ({
        value: item._id,
        label: item.name,
      }));
      setMaterialOptions(options);
    } catch (err) {
      message.error("Không thể tải danh sách chất liệu.");
    } finally {
      setMaterialLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterialsForSelect();
  }, []);

  const { mutate: createMutate, status } = useMutation({
    mutationFn: async (formData: FormData) => createVariation(productId!, formData),
    onSuccess: () => {
      message.success("Tạo biến thể sản phẩm thành công!")
      form.resetFields()
      navigate(`/admin/products/variants/${productId}`)
    },
    onError: (error: any) => {
      console.error(error)
      message.error(error?.response?.data?.message || "Tạo biến thể sản phẩm thất bại!")
    },
  })

  const isLoading = status === "pending"

  const normFile = (e: any) => (Array.isArray(e) ? e : e?.fileList || [])

  const handleFinish = (values: any) => {
    if (!productId) {
      message.error("Không tìm thấy sản phẩm")
      return
    }

    if (!values.colorImage || values.colorImage.length === 0) {
      message.error("Vui lòng tải lên ít nhất một ảnh màu")
      return
    }

    const formData = new FormData()
    formData.append("name", values.name)
    formData.append("sku", values.sku)
    const dimensions = `${values.length}x${values.width}x${values.height}`
    formData.append("dimensions", dimensions)
    formData.append("basePrice", values.basePrice.toString())
    formData.append("priceAdjustment", (values.priceAdjustment ?? 0).toString())
    formData.append("importPrice", values.importPrice.toString())
    formData.append("salePrice", (values.salePrice ?? 0).toString())
    formData.append("stockQuantity", values.stockQuantity.toString())
    formData.append("colorName", values.colorName)
    formData.append("colorHexCode", values.colorHexCode)
    formData.append("material", values.material)
    formData.append("colorImageUrl", "placeholder")

    values.colorImage.forEach((file: any) => {
      if (file.originFileObj) {
        formData.append("images", file.originFileObj)
      }
    })

    createMutate(formData)
  }

  return (
    <div style={{ padding: "24px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      {/* Header Section */}
      <div style={{ marginBottom: "24px" }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/admin/products/variants/${productId}`)}
          style={{ padding: 0, marginBottom: "16px" }}
        >
          Quay lại danh sách biến thể
        </Button>

        <Title level={2} style={{ margin: 0, color: "#1890ff" }}>
          ➕ Tạo biến thể sản phẩm mới
        </Title>
        <Text type="secondary">Điền thông tin chi tiết để tạo biến thể sản phẩm</Text>
      </div>

      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        initialValues={{
          priceAdjustment: 0,
          salePrice: 0,
          length: 0,
          width: 0,
          height: 0,
        }}
      >
        <Row gutter={[24, 24]}>
          {/* Basic Information Section */}
          <Col span={24}>
            <Card
              title={
                <Space>
                  <span>📝 Thông tin cơ bản</span>
                </Space>
              }
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        <span>Tên biến thể</span>
                        <Tooltip title="Tên mô tả cho biến thể sản phẩm">
                          <InfoCircleOutlined style={{ color: "#1890ff" }} />
                        </Tooltip>
                      </Space>
                    }
                    name="name"
                    rules={[{ required: true, message: "Vui lòng nhập tên biến thể" }]}
                  >
                    <Input size="large" placeholder="Nhập tên biến thể..." />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={
                      <Space>
                        <span>SKU</span>
                        <Tooltip title="Mã định danh duy nhất cho sản phẩm">
                          <InfoCircleOutlined style={{ color: "#1890ff" }} />
                        </Tooltip>
                      </Space>
                    }
                    name="sku"
                    rules={[{ required: true, message: "Vui lòng nhập SKU" }]}
                  >
                    <Input size="large" placeholder="Nhập mã SKU..." />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Chất liệu"
                    name="material"
                    rules={[{ required: true, message: "Vui lòng chọn chất liệu" }]}
                  >
                    <Row gutter={8}>
                      <Col flex="auto">
                        <Select
                          size="large"
                          placeholder="Chọn chất liệu..."
                          loading={materialLoading}
                          value={form.getFieldValue("material")} // ✅ đảm bảo là _id string
                          onChange={(value) => form.setFieldValue("material", value)} // ✅ ép giá trị là string
                          options={materialOptions}
                          showSearch
                          optionFilterProp="label"
                          optionLabelProp="label"
                          filterOption={(input, option) =>
                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                        />
                      </Col>
                      <Col>
                        <Button
                          icon={<PlusOutlined />}
                          size="large"
                          onClick={() => navigate("/admin/materials")}
                        />
                      </Col>
                    </Row>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Kích thước (cm)" required>
                    <Input.Group compact>
                      <Form.Item name="length" noStyle rules={[{ required: true, message: "Nhập chiều dài" }]}>
                        <InputNumber min={0} placeholder="Dài" style={{ width: "33%" }} size="large" />
                      </Form.Item>
                      <Form.Item name="width" noStyle rules={[{ required: true, message: "Nhập chiều rộng" }]}>
                        <InputNumber min={0} placeholder="Rộng" style={{ width: "33%" }} size="large" />
                      </Form.Item>
                      <Form.Item name="height" noStyle rules={[{ required: true, message: "Nhập chiều cao" }]}>
                        <InputNumber min={0} placeholder="Cao" style={{ width: "34%" }} size="large" />
                      </Form.Item>
                    </Input.Group>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Pricing Section */}
          <Col span={24}>
            <Card
              title={
                <Space>
                  <span>💰 Thông tin giá cả</span>
                </Space>
              }
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label="Giá gốc (VNĐ)"
                    name="basePrice"
                    rules={[{ required: true, message: "Vui lòng nhập giá gốc" }]}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      size="large"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Giá nhập (VNĐ)"
                    name="importPrice"
                    rules={[{ required: true, message: "Vui lòng nhập giá nhập" }]}
                  >
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      size="large"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label="Tồn kho"
                    name="stockQuantity"
                    rules={[{ required: true, message: "Vui lòng nhập số lượng tồn kho" }]}
                  >
                    <InputNumber min={0} style={{ width: "100%" }} size="large" placeholder="0" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item label="Điều chỉnh giá (VNĐ)" name="priceAdjustment">
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      size="large"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item label="Giá khuyến mãi (VNĐ)" name="salePrice">
                    <InputNumber
                      min={0}
                      style={{ width: "100%" }}
                      size="large"
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
                      placeholder="0"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Color & Media Section */}
          <Col span={24}>
            <Card
              title={
                <Space>
                  <span>🎨 Màu sắc & Hình ảnh</span>
                </Space>
              }
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Tên màu"
                    name="colorName"
                    rules={[{ required: true, message: "Vui lòng nhập tên màu" }]}
                  >
                    <Input size="large" placeholder="Ví dụ: Đỏ cherry, Xanh navy..." />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Mã màu HEX"
                    name="colorHexCode"
                    rules={[{ required: true, message: "Vui lòng chọn mã màu" }]}
                  >
                    <Input type="color" size="large" maxLength={7} placeholder="#RRGGBB" style={{ height: "40px" }} />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item
                    label={
                      <Space>
                        <span>Ảnh màu sắc</span>
                        <Text type="secondary">(Tối đa 5 ảnh, mỗi ảnh {"<"} 5MB)</Text>
                      </Space>
                    }
                    name="colorImage"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    rules={[{ required: true, message: "Vui lòng thêm ít nhất 1 ảnh màu" }]}
                  >
                    <Upload.Dragger
                      beforeUpload={(file) => {
                        const isImage = file.type.startsWith("image/")
                        if (!isImage) {
                          message.error("Chỉ chấp nhận file ảnh!")
                          return Upload.LIST_IGNORE
                        }
                        const isLt5M = file.size / 1024 / 1024 < 5
                        if (!isLt5M) {
                          message.error("Ảnh phải nhỏ hơn 5MB!")
                          return Upload.LIST_IGNORE
                        }
                        return false
                      }}
                      listType="picture"
                      multiple
                      maxCount={5}
                      accept="image/*"
                      style={{
                        backgroundColor: "#fafafa",
                        border: "2px dashed #d9d9d9",
                        borderRadius: "8px",
                      }}
                    >
                      <p className="ant-upload-drag-icon">
                        <UploadOutlined style={{ fontSize: "48px", color: "#1890ff" }} />
                      </p>
                      <p className="ant-upload-text" style={{ fontSize: "16px", fontWeight: 500 }}>
                        Kéo thả ảnh vào đây hoặc click để chọn
                      </p>
                      <p className="ant-upload-hint" style={{ color: "#999" }}>
                        Hỗ trợ định dạng: JPG, PNG, GIF. Tối đa 5 ảnh.
                      </p>
                    </Upload.Dragger>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Action Buttons */}
          <Col span={24}>
            <Card style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Button size="large" block onClick={() => navigate(`/admin/products/variants/${productId}`)}>
                    ❌ Hủy bỏ
                  </Button>
                </Col>
                <Col xs={24} md={12}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    loading={isLoading}
                    style={{
                      background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
                      border: "none",
                      fontWeight: 600,
                    }}
                  >
                    💾 Lưu biến thể sản phẩm
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  )
}

export default CreateProductVariationPage
