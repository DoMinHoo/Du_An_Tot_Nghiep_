import React, { useState } from "react";

import {
  Button,
  Layout,
  Popconfirm,
  Space,
  Table,
  message,
  Input,
} from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCategory, getCategories } from "../../Services/categories.service";
import { Link, useNavigate } from "react-router-dom";

const { Content } = Layout;

const CategoryManager: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState(""); // lọc
  // Lấy danh sách danh mục
  const { data = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

    // Lọc dữ liệu theo tên danh mục
  const filteredData = data.filter((item: any) =>
    item.name?.toLowerCase().includes(searchText.toLowerCase())
  );
  // Mutation xoá danh mục
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      message.success("Xoá danh mục thành công");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || "Xoá danh mục thất bại");
    },
  });

  // Xác nhận xoá
  const confirmDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  // Cấu hình cột
  const columns = [
    {
      title: "Tên danh mục",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Danh mục cha",
      dataIndex: "parentId",
      key: "parentId",
      render: (parent: any) => (parent && typeof parent === "object" ? parent.name : "-"),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button onClick={() => navigate(`/admin/categories/edit/${record._id}`)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xoá danh mục này?"
            onConfirm={() => confirmDelete(record._id)}
            okText="Xoá"
            cancelText="Huỷ"
          >
            <Button danger loading={deleteMutation.isLoading}>
              Xoá
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Content style={{ padding: 24, background: "#fff" }}>
         <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <Input.Search
        placeholder="Tìm theo tên danh mục"//lọc
        allowClear
        onChange={(e) => setSearchText(e.target.value)}
        style={{ maxWidth: 300 }}
      /> 
        <Link to="/admin/categories/create">
          <Button type="primary">Thêm danh mục</Button>
        </Link>
      </div>

      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filteredData}// loc
        loading={isLoading}
      />
    </Content>
  );
};

export default CategoryManager;
