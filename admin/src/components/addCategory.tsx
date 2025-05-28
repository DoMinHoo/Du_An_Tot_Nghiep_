import React, { useState } from "react";
import { Button, Form, Input, Modal, Select } from "antd";

interface CategoryFormProps {
  parentOptions: { label: string; value: string }[]; // danh sách danh mục cha
}

const AddCategoryModal: React.FC<CategoryFormProps> = ({ parentOptions }) => {
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();

  const showModal = () => setVisible(true);
  const handleCancel = () => setVisible(false);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        console.log("Submit values:", values);
        // Gửi dữ liệu tới backend tại đây
        form.resetFields();
        setVisible(false);
      })
      .catch((info) => console.log("Validation Failed:", info));
  };

  return (
    <>
      <Button type="primary" onClick={showModal}>
        Thêm Danh mục
      </Button>
      <Modal
        title="Thêm danh mục mới"
        open={visible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="parentId" label="Danh mục cha">
            <Select
              allowClear
              placeholder="Chọn danh mục cha (nếu có)"
              options={parentOptions}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AddCategoryModal;
