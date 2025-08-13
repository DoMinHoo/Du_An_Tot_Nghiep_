// src/components/Layout/VariationModal.tsx
import React, { useEffect, useState } from "react";
import {
    Modal,
    Form,
    Input,
    InputNumber,
    Upload,
    Button,
    message,
    Select,
    Row,
    Col,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { ColorPicker } from "antd"; // if using antd v5; else use react-color
import { getMaterials } from "../../Services/materials.service";
import type {
    ProductVariationFormData,
    VariationModalProps,
} from "../../Types/productVariant.interface";

const { Option } = Select;
const normFile = (e: any) => (Array.isArray(e) ? e : e?.fileList || []);

const VariationModal: React.FC<VariationModalProps> = ({
    visible,
    onCancel,
    onSave,
    data,
}) => {
    const [form] = Form.useForm();
    const [materials, setMaterials] = useState<{ label: string; value: string }[]>(
        []
    );
    const [fileList, setFileList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            fetchMaterials();
            if (data) {
                // parse dimensions if provided as "LxWxH cm"
                let length: number | undefined,
                    width: number | undefined,
                    height: number | undefined;
                if (data.dimensions) {
                    const raw = String(data.dimensions).replace(/\s*cm\s*$/i, "");
                    const parts = raw.split("x").map((s) => Number(s));
                    if (parts.length === 3) {
                        [length, width, height] = parts;
                    }
                }

                form.setFieldsValue({
                    name: data.name,
                    sku: data.sku,
                    materialVariation: (data as any).material?._id ?? (data as any).material ?? undefined,
                    length,
                    width,
                    height,
                    basePrice: data.basePrice,
                    priceAdjustment: data.priceAdjustment ?? 0,
                    stockQuantity: data.stockQuantity,
                    salePrice: data.salePrice ?? undefined,
                    colorName: data.colorName,
                    colorHexCode: data.colorHexCode,
                });

                if (data.colorImageUrl) {
                    setFileList([
                        {
                            uid: "-1",
                            name: "preview",
                            status: "done",
                            url: data.colorImageUrl,
                        },
                    ]);
                } else {
                    setFileList([]);
                }
            } else {
                form.resetFields();
                setFileList([]);
            }
        }
    }, [visible, data]);

    const fetchMaterials = async () => {
        try {
            const res = await getMaterials();
            // expect res.data array
            setMaterials(res.data.map((m: any) => ({ label: m.name, value: m._id })));
        } catch (err) {
            console.error(err);
            message.error("Không thể tải danh sách chất liệu");
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            // build string dimensions
            const dimensions = `${values.length}x${values.width}x${values.height} cm`;

            // compute finalPrice
            const base = Number(values.basePrice || 0);
            const adj = Number(values.priceAdjustment || 0);
            const finalPrice = base + adj;

            // handle image: if user selected a new file => originFileObj
            const firstFile = fileList && fileList[0];
            const hasNewFile = firstFile && firstFile.originFileObj;
            const colorImageFile: File | undefined = hasNewFile
                ? firstFile.originFileObj
                : undefined;

            // temporary URL for preview (not used on backend)
            const colorImageUrl =
                colorImageFile !== undefined
                    ? URL.createObjectURL(colorImageFile)
                    : data?.colorImageUrl || "";

            const variation: ProductVariationFormData = {
                name: values.name,
                sku: values.sku,
                dimensions,
                basePrice: base,
                priceAdjustment: adj,
                finalPrice,
                salePrice: values.salePrice ?? null,
                stockQuantity: Number(values.stockQuantity),
                colorName: values.colorName,
                colorHexCode: values.colorHexCode,
                colorImageUrl,                // temporary or existing URL
                colorImageFile,               // optional file object for parent to upload
                materialVariation: values.materialVariation, // THIS IS _id (string)
            };

            // final check: ensure materialVariation exists and is a string id
            if (!variation.materialVariation || typeof variation.materialVariation !== "string") {
                message.error("Chất liệu không hợp lệ (phải chọn 1 chất liệu).");
                return;
            }

            onSave(variation);
        } catch (err) {
            console.error(err);
            message.error("Vui lòng kiểm tra các trường nhập.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={data ? "Sửa biến thể" : "Thêm biến thể"}
            open={visible}
            onCancel={() => { form.resetFields(); onCancel(); }}
            onOk={handleOk}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={loading}
            width={720}
        >
            <Form form={form} layout="vertical">
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="name" label="Tên biến thể" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item name="sku" label="SKU" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="materialVariation"
                    label="Chất liệu"
                    rules={[{ required: true, message: "Vui lòng chọn chất liệu" }]}
                >
                    <Select placeholder="Chọn chất liệu" options={materials} />
                </Form.Item>

                <Form.Item label="Kích thước (cm)" required>
                    <Input.Group compact>
                        <Form.Item name="length" noStyle rules={[{ required: true }]}>
                            <InputNumber min={0} placeholder="Dài" style={{ width: "33%" }} />
                        </Form.Item>
                        <Form.Item name="width" noStyle rules={[{ required: true }]}>
                            <InputNumber min={0} placeholder="Rộng" style={{ width: "33%" }} />
                        </Form.Item>
                        <Form.Item name="height" noStyle rules={[{ required: true }]}>
                            <InputNumber min={0} placeholder="Cao" style={{ width: "34%" }} />
                        </Form.Item>
                    </Input.Group>
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="basePrice" label="Giá gốc (VNĐ)" rules={[{ required: true }]}>
                            <InputNumber
                                style={{ width: "100%" }}
                                min={0}
                                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={(v) => String(v).replace(/(,*)/g, "")}
                            />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item name="priceAdjustment" label="Điều chỉnh giá (VNĐ)" initialValue={0}>
                            <InputNumber
                                style={{ width: "100%" }}
                                min={0}
                                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                parser={(v) => String(v).replace(/(,*)/g, "")}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="stockQuantity" label="Tồn kho" rules={[{ required: true }]}>
                    <InputNumber style={{ width: "100%" }} min={0} />
                </Form.Item>

                <Form.Item name="salePrice" label="Giá khuyến mãi (VNĐ)">
                    <InputNumber
                        style={{ width: "100%" }}
                        min={0}
                        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        parser={(v) => String(v).replace(/(,*)/g, "")}
                    />
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="colorName" label="Tên màu" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item label="Mã màu (HEX)" name="colorHexCode" rules={[{ required: true }]}>
                            {/* ColorPicker returns object; we set field value in onChange below */}
                            <ColorPicker
                                value={form.getFieldValue("colorHexCode")}
                                onChange={(c) => {
                                    const hex = (c as any)?.toHexString ? (c as any).toHexString() : String(c);
                                    form.setFieldsValue({ colorHexCode: hex });
                                }}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    label="Ảnh màu (1 ảnh, &lt;5MB)"
                    name="colorImage"
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                    rules={[{
                        validator: (_, fileList) => {
                            if ((!fileList || fileList.length === 0) && !data?.colorImageUrl) {
                                return Promise.reject(new Error("Vui lòng thêm 1 ảnh màu"));
                            }
                            if (fileList?.length > 1) return Promise.reject(new Error("Chỉ 1 ảnh"));
                            return Promise.resolve();
                        }
                    }]}
                >
                    <Upload.Dragger
                        fileList={fileList}
                        onChange={({ fileList }) => setFileList(fileList)}
                        beforeUpload={(file) => {
                            const isImage = file.type.startsWith("image/");
                            if (!isImage) { message.error("Chỉ chấp nhận ảnh"); return Upload.LIST_IGNORE; }
                            const isLt5 = file.size / 1024 / 1024 < 5;
                            if (!isLt5) { message.error("Ảnh phải < 5MB"); return Upload.LIST_IGNORE; }
                            return false; // prevent auto upload
                        }}
                        listType="picture"
                        maxCount={1}
                        accept="image/*"
                        style={{ backgroundColor: "#fafafa", borderRadius: 8 }}
                    >
                        <p style={{ fontSize: 16, fontWeight: 500 }}><UploadOutlined /> Kéo thả hoặc click để chọn</p>
                    </Upload.Dragger>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default VariationModal;
