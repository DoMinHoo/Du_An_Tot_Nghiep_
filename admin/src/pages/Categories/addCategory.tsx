import React from "react";
import { Button, Form, Input, Select, message, Card, Space } from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCategory, getCategories } from "../../Services/categories.service";
import { useNavigate } from "react-router-dom";

const AddCategory: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => createCategory(data),
    onSuccess: () => {
      message.success("Thêm danh mục thành công");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      navigate("/admin/categories");
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || "Thêm danh mục thất bại");
    },
  });

  const onFinish = (values: any) => {
    const { name, description, parentId } = values;

    const payload: any = {
      name,
      description,
    };

    if (parentId) {
      payload.parentId = parentId;
    }

    mutation.mutate(payload);
  };

  const parentOptions = categories.map((item: any) => ({
    label: item.name,
    value: item._id,
  }));

  return (
    <Card title="Thêm danh mục" style={{ maxWidth: 600, margin: "auto" }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ parentId: null }} // ✅ tránh undefined
      >
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

        <Form.Item>
          <Space>
            <Button htmlType="submit" type="primary" loading={mutation.isLoading}>
              Lưu
            </Button>
            <Button onClick={() => navigate("/admin/categories")}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddCategory;
