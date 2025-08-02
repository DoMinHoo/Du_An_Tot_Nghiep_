import React, { useEffect } from "react";
import {
  Button,
  Form,
  Input,
  Select,
  message,
  Card,
  Space,
  Spin,
  Typography,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCategories, updateCategory } from "../../Services/categories.service";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const { Title } = Typography;

const EditCategory: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();

  // ✅ Lấy dữ liệu danh mục đang chỉnh sửa
  const {
    data: categoryData,
    isLoading: loadingCategory,
    isError: errorCategory,
  } = useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      if (!id) throw new Error("Missing ID");
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/categories/${id}`);
      if (!res.data || !res.data._id) {
        throw new Error("Không tìm thấy danh mục");
      }
      return res.data; // ✅ TRẢ TRỰC TIẾP res.data nếu nó là object danh mục
    }

    // enabled: !!id,
  });

  // ✅ Lấy danh sách tất cả danh mục để chọn cha
  const {
    data: allCategories = [],
    isLoading: loadingAllCategories,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // ✅ Gửi form cập nhật
  const mutation = useMutation({
    mutationFn: (values: any) => updateCategory(id!, values),
    onSuccess: () => {
      message.success("Cập nhật danh mục thành công");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      navigate("/admin/categories");
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || "Cập nhật thất bại");
    },
  });

  // ✅ Đổ dữ liệu vào form
  useEffect(() => {
    if (categoryData) {
      form.setFieldsValue({
        name: categoryData.name,
        description: categoryData.description,
        parentId: categoryData.parentId?._id || null,
      });
    }
  }, [categoryData, form]);

  const onFinish = (values: any) => {
    mutation.mutate(values);
  };

  // ✅ Loại trừ chính nó ra khỏi danh mục cha
  const parentOptions = allCategories
    .filter((item: any) => item._id !== id)
    .map((item: any) => ({
      label: item.name,
      value: item._id,
    }));

  // ✅ Loading hoặc lỗi
  if (loadingCategory) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (errorCategory || !categoryData) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Title level={4} type="danger">
          Không thể tải dữ liệu danh mục
        </Title>
        <Button onClick={() => navigate("/admin/categories")}>Quay lại</Button>
      </div>
    );
  }

  return (
    <Card title="Chỉnh sửa danh mục" style={{ maxWidth: 600, margin: "auto" }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ parentId: null }}
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

        {/* <Form.Item name="parentId" label="Danh mục cha">
          <Select
            allowClear
            placeholder="Chọn danh mục cha (nếu có)"
            options={parentOptions}
            loading={loadingAllCategories}
          />
        </Form.Item> */}

        <Form.Item>
          <Space>
            <Button htmlType="submit" type="primary" loading={mutation.isLoading}>
              Cập nhật
            </Button>
            <Button onClick={() => navigate("/admin/categories")}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EditCategory;
