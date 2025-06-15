"use client"

import { ArrowLeftOutlined, UploadOutlined, InfoCircleOutlined, EditOutlined } from "@ant-design/icons"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Upload,
  Space,
  Typography,
  Tooltip,
  Spin,
} from "antd"
import type React from "react"
import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getVariationById, updateVariation } from "../../../Services/productVariation.Service"

const { Title, Text } = Typography

const UpdateProductVariationPage: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id: productId, variationId } = useParams()

  const { data: variation, isLoading: isFetching } = useQuery({
    queryKey: ["variation", variationId],
    queryFn: () => getVariationById(productId!, variationId!),
    enabled: !!productId && !!variationId,
  })

  const { mutate: updateMutate, status } = useMutation<any, unknown, FormData>({
    mutationFn: async (formData: FormData) => updateVariation(productId!, variationId!, formData),
    onSuccess: () => {
      message.success("Cập nhật biến thể thành công!")
      navigate(`/admin/products/variants/${productId}`)
    },
    onError: (error: any) => {
      console.error(error)
      message.error(error?.response?.data?.message || "Cập nhật biến thể thất bại!")
    },
  })

  const isUpdating = status === "pending"

  useEffect(() => {
    if (variation) {
      const [length = 0, width = 0, height = 0] = variation.dimensions?.split("x").map(Number) || []

      form.setFieldsValue({
        ...variation,
        length,
        width,
        height,
        colorImage: variation.colorImageUrl
          ? Array.isArray(variation.colorImageUrl)
            ? variation.colorImageUrl.map((img: string, idx: number) => ({
                uid: `-existing-${idx}`,
                name: `Ảnh màu ${idx + 1}`,
                status: "done",
                url: img.startsWith("http") ? img : `http://localhost:5000${img}`,
              }))
            : [
                {
                  uid: "-1",
                  name: "Ảnh màu",
                  status: "done",
                  url: variation.colorImageUrl.startsWith("http")
                    ? variation.colorImageUrl
                    : `http://localhost:5000${variation.colorImageUrl}`,
                },
              ]
          : [],
      })
    }
  }, [variation, form])

  const normFile = (e: any) => (Array.isArray(e) ? e : e?.fileList || [])

  const handleFinish = (values: any) => {
    if (!productId || !variationId) {
      message.error("Không tìm thấy thông tin sản phẩm hoặc biến thể.")
      return
    }

    const formData = new FormData()

    formData.append("name", values.name)
    formData.append("sku", values.sku)
    formData.append("dimensions", `${values.length}x${values.width}x${values.height}`)
    formData.append("basePrice", values.basePrice.toString())
    formData.append("priceAdjustment", (values.priceAdjustment ?? 0).toString())
    formData.append("importPrice", values.importPrice.toString())
    formData.append("salePrice", (values.salePrice ?? 0).toString())
    formData.append("stockQuantity", values.stockQuantity.toString())
    formData.append("colorName", values.colorName)
    formData.append("colorHexCode", values.colorHexCode)
    formData.append("materialVariation", values.materialVariation)

    // Check nếu thêm ảnh hoặc chưa thêm ảnh
    const files = values.colorImage

    if (files && files.length > 0) {
      // nếu ảnh có originFileObj -> thêm ảnh
      files.forEach((file: any) => {
        if (file.originFileObj) {
          formData.append("images", file.originFileObj)
        }
      })
    } else if (variation?.colorImageUrl) {
      // nếu chưa thêm ảnh mà biến thể vẫn có ảnh -> gửi ảnh cũ lên
      if (Array.isArray(variation.colorImageUrl)) {
        variation.colorImageUrl.forEach((url) => {
          formData.append("colorImageUrl", url)
        })
      } else if (variation.colorImageUrl) {
        formData.append("colorImageUrl", variation.colorImageUrl)
      }
    }

    updateMutate(formData)
  }

  if (isFetching) {
    return (
      <div style={{ padding: "24px", backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <Spin size="large" />
          <Text style={{ marginLeft: "16px", fontSize: "16px" }}>Đang tải thông tin biến thể...</Text>
        </div>
      </div>
    )
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
          <EditOutlined /> Cập nhật biến thể sản phẩm
        </Title>
        <Text type="secondary">Chỉnh sửa thông tin chi tiết của biến thể sản phẩm</Text>
        {variation && (
          <div style={{ marginTop: "8px" }}>
            <Text strong>Đang chỉnh sửa: </Text>
            <Text code>{variation.name}</Text>
            <Text type="secondary" style={{ marginLeft: "16px" }}>
              SKU: {variation.sku}
            </Text>
          </div>
        )}
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
                  <Text type="secondary" style={{ fontSize: "12px", fontWeight: "normal" }}>
                    (Cập nhật thông tin chính của biến thể)
                  </Text>
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
                    name="materialVariation"
                    rules={[{ required: true, message: "Vui lòng nhập chất liệu" }]}
                  >
                    <Input size="large" placeholder="Nhập chất liệu..." />
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
                  <Text type="secondary" style={{ fontSize: "12px", fontWeight: "normal" }}>
                    (Cập nhật giá bán và tồn kho)
                  </Text>
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
                  <Text type="secondary" style={{ fontSize: "12px", fontWeight: "normal" }}>
                    (Cập nhật màu sắc và ảnh sản phẩm)
                  </Text>
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
                        <Text type="secondary">
                          (Tối đa 5 ảnh, mỗi ảnh {"<"} 5MB - Để trống nếu không muốn thay đổi)
                        </Text>
                      </Space>
                    }
                    name="colorImage"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
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
                        Kéo thả ảnh mới vào đây hoặc click để chọn
                      </p>
                      <p className="ant-upload-hint" style={{ color: "#999" }}>
                        Hỗ trợ định dạng: JPG, PNG, GIF. Để trống nếu không muốn thay đổi ảnh hiện tại.
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
                    loading={isUpdating}
                    style={{
                      background: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
                      border: "none",
                      fontWeight: 600,
                    }}
                  >
                    💾 Cập nhật biến thể sản phẩm
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

export default UpdateProductVariationPage
