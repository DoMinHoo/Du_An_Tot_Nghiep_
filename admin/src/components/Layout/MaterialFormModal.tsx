import { Modal, Form, Input } from "antd";
import { useEffect } from "react";
import type { Material } from "../../Types/materials.interface";

interface Props {
    visible: boolean;
    onCancel: () => void;
    onFinish: (data: { name: string }) => void;
    initialValues?: Material | null;
}

const MaterialFormModal: React.FC<Props> = ({ visible, onCancel, onFinish, initialValues }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        form.setFieldsValue(initialValues || { name: "" });
    }, [initialValues]);

    return (
        <Modal
            open={visible}
            title={initialValues ? "Sửa chất liệu" : "Thêm chất liệu"}
            okText="Lưu"
            cancelText="Hủy"
            onCancel={onCancel}
            onOk={() => form.submit()}
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                    label="Tên chất liệu"
                    name="name"
                    rules={[{ required: true, message: "Vui lòng nhập tên chất liệu!" }]}
                >
                    <Input placeholder="VD: Gỗ sồi" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default MaterialFormModal;
