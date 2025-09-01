import {
  ArrowLeftOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons"
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
  Select,
  Spin,
  DatePicker,
} from "antd"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getVariationById, updateVariation } from "../../../Services/productVariation.Service"
import { getMaterials } from "../../../Services/materials.service"
import dayjs from "dayjs"

const { Title, Text } = Typography

const UpdateProductVariationPage = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { id: productId, variationId } = useParams()

  const [materialOptions, setMaterialOptions] = useState<{ value: string; label: string }[]>([])
  const [materialLoading, setMaterialLoading] = useState<boolean>(false)

  useEffect(() => {
    const fetchMaterials = async () => {
      setMaterialLoading(true)
      try {
        const res = await getMaterials()
        const mapped = res.data.map((mat) => ({
          value: mat._id,
          label: mat.name,
        }))
        setMaterialOptions(mapped)
      } catch (e) {
        message.error("Không thể tải danh sách chất liệu")
      } finally {
        setMaterialLoading(false)
      }
    }
    fetchMaterials()
  }, [])

  const { data: variation, isLoading } = useQuery({
    queryKey: ["variation", variationId],
    queryFn: () => getVariationById(productId!, variationId!),
    enabled: !!productId && !!variationId,
  })

  useEffect(() => {
    if (variation && materialOptions.length > 0) {
      const dims = variation.dimensions?.split("x") || []
      const [length = "", width = "", height = ""] = dims
      console.log("Dữ liệu variation từ API:", variation)
      form.setFieldsValue({
        name: variation.name,
        sku: variation.sku,
        basePrice: variation.basePrice,
        salePrice: variation.salePrice,
        flashSaleStart: variation.flashSaleStart ? dayjs(variation.flashSaleStart) : null,
        flashSaleEnd: variation.flashSaleEnd ? dayjs(variation.flashSaleEnd) : null,
        priceAdjustment: variation.priceAdjustment,
        stockQuantity: variation.stockQuantity,
        length: Number(length),
        width: Number(width),
        height: Number(height),
        colorName: variation.colorName,
        colorHexCode: variation.colorHexCode,
        material: variation.material?._id || variation.material,
        colorImage: Array.isArray(variation.colorImageUrl)
          ? variation.colorImageUrl.map((url, idx) => ({
            uid: `-existing-${idx}`,
            name: `Ảnh ${idx + 1}`,
            url: url.startsWith("http") ? url : `http://localhost:5000${url}`,
            status: "done",
          }))
          : variation.colorImageUrl
            ? [{
              uid: "-1",
              name: "Ảnh màu",
              url: variation.colorImageUrl.startsWith("http")
                ? variation.colorImageUrl
                : `http://localhost:5000${variation.colorImageUrl}`,
              status: "done",
            }]
            : [],
      })
    }
  }, [variation, materialOptions])

  const normFile = (e: any) => (Array.isArray(e) ? e : e?.fileList || [])

  const { mutate: updateMutate, status } = useMutation<any, unknown, FormData>({
    mutationFn: (formData) => updateVariation(productId!, variationId!, formData),
    onSuccess: () => {
      message.success("Cập nhật thành công!")
      navigate(`/admin/products/variants/${productId}`)
    },
    onError: (err: any) => {
      console.error("Lỗi cập nhật:", err)
      message.error(err?.response?.data?.message || "Lỗi khi cập nhật biến thể")
    },
  })

  const handleFinish = (values: any) => {
    const formData = new FormData()
    formData.append("name", values.name)
    formData.append("sku", values.sku)
    formData.append("dimensions", `${values.length}x${values.width}x${values.height}`)
    formData.append("basePrice", values.basePrice)
    formData.append("priceAdjustment", values.priceAdjustment ?? 0)
    formData.append("salePrice", values.salePrice ?? 0)
    if (values.flashSaleStart) {
      formData.append("flashSaleStart", values.flashSaleStart.toISOString())
    }
    if (values.flashSaleEnd) {
      formData.append("flashSaleEnd", values.flashSaleEnd.toISOString())
    }

    formData.append("stockQuantity", values.stockQuantity)
    formData.append("colorName", values.colorName)
    formData.append("colorHexCode", values.colorHexCode)
    formData.append("material", typeof values.material === "object" ? values.material.value : values.material)

    const files = values.colorImage
    files?.forEach((file: any) => {
      if (file.originFileObj) {
        formData.append("images", file.originFileObj)
      } else if (file.url) {
        const cleanUrl = file.url.replace("http://localhost:5000", "")
        formData.append("colorImageUrl", cleanUrl)
      }
    })

    updateMutate(formData)
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <Spin size="large" />
        <p>Đang tải thông tin biến thể...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/admin/products/variants/${productId}`)}>
        Quay lại danh sách biến thể
      </Button>

      <Title level={2} style={{ margin: "16px 0", color: "#1890ff" }}>
        <EditOutlined /> Cập nhật biến thể sản phẩm
      </Title>

      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        initialValues={{ priceAdjustment: 0, salePrice: 0, length: 0, width: 0, height: 0 }}
      >
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card
              title={<span>📝 Thông tin cơ bản</span>}
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={<span>Tên biến thể <InfoCircleOutlined /></span>}
                    name="name"
                    rules={[{ required: true, message: "Vui lòng nhập tên biến thể" }]}
                  >
                    <Input size="large" placeholder="Nhập tên biến thể..." />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={<span>SKU <InfoCircleOutlined /></span>}
                    name="sku"
                    rules={[{ required: true, message: "Vui lòng nhập SKU" }]}
                  >
                    <Input size="large" placeholder="Nhập mã SKU..." />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Chất liệu" name="material" rules={[{ required: true, message: "Vui lòng chọn chất liệu" }]}>
                    <Row gutter={8}>
                      <Col flex="auto">
                        <Select
                          size="large"
                          placeholder="Chọn chất liệu..."
                          loading={materialLoading}
                          options={materialOptions}
                          showSearch
                          optionFilterProp="label"
                          optionLabelProp="label"
                          onChange={(value) => form.setFieldValue("material", value)}
                        />
                      </Col>
                      <Col>
                        <Button icon={<PlusOutlined />} size="large" onClick={() => navigate("/admin/materials")} />
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

          <Col span={24}>
            <Card title={<span>💰 Thông tin giá & khuyến mãi</span>} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}><Form.Item label="Giá gốc (VNĐ)" name="basePrice" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} size="large" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item label="Điều chỉnh giá (VNĐ)" name="priceAdjustment"><InputNumber min={0} style={{ width: "100%" }} size="large" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item label="Giá khuyến mãi (VNĐ)" name="salePrice"><InputNumber min={0} style={{ width: "100%" }} size="large" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item label="Tồn kho" name="stockQuantity" rules={[{ required: true }]}><InputNumber min={0} style={{ width: "100%" }} size="large" /></Form.Item></Col>
              </Row>
            </Card>
          </Col>



          <Col span={24}>
            <Card title={<span>🎨 Màu sắc & Hình ảnh</span>} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}><Form.Item label="Tên màu" name="colorName" rules={[{ required: true }]}><Input size="large" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item label="Mã màu HEX" name="colorHexCode" rules={[{ required: true }]}><Input type="color" size="large" style={{ height: "40px" }} /></Form.Item></Col>
                <Col span={24}>
                  <Form.Item
                    label={
                      <Space>
                        <span>Ảnh màu sắc</span>
                        <Text type="secondary">(Chỉ 1 ảnh, &lt; 5MB)</Text>
                      </Space>
                    }
                    name="colorImage"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    rules={[
                      {
                        validator: (_, fileList) => {

                          if (fileList.length > 1) {
                            return Promise.reject(new Error("Chỉ được phép chọn 1 ảnh"))
                          }
                          return Promise.resolve()
                        },
                      },
                    ]}
                  >
                    <Upload.Dragger
                      beforeUpload={(file) => {
                        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
                        const isImage = file.type.startsWith("image/")
                        if (!isImage) {
                          message.error("Chỉ chấp nhận file ảnh!")
                          return Upload.LIST_IGNORE
                        }
                        if (!validTypes.includes(file.type)) {
                          message.error("❌ Only images are allowed (jpeg, jpg, png, gif)!");
                          return Upload.LIST_IGNORE;
                        }

                        const isLt5M = file.size / 1024 / 1024 < 5
                        if (!isLt5M) {
                          message.error("Ảnh phải nhỏ hơn 5MB!")
                          return Upload.LIST_IGNORE
                        }
                        return false // để tránh upload tự động
                      }}
                      listType="picture"
                      maxCount={1}
                      multiple={false}
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
                        Hỗ trợ JPG, PNG, GIF. Tối đa 1 ảnh.
                      </p>
                    </Upload.Dragger>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col span={24}>
            <Card style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <Row gutter={16}>
                <Col xs={24} md={12}><Button size="large" block onClick={() => navigate(`/admin/products/variants/${productId}`)}>❌ Hủy</Button></Col>
                <Col xs={24} md={12}><Button type="primary" htmlType="submit" size="large" block loading={status === "pending"} style={{ background: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)", border: "none", fontWeight: 600 }}>💾 Lưu thay đổi</Button></Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>

  )
}

export default UpdateProductVariationPage
