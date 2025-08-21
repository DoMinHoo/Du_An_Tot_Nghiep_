import {
  Table,
  Tag,
  Image,
  Space,
  Button,
  Popconfirm,
  Card,
  Tooltip,
  message,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  BranchesOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../Types/product.interface";
import {
  softDeleteProduct,
  getProductMaterials,
} from "../../Services/products.service";
import { useEffect, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";

const ProductList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [materialsMap, setMaterialsMap] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Lấy danh sách sản phẩm (server-side pagination)
  const { data, isLoading } = useQuery<{
    data: Product[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>({
    queryKey: ["products", page, pageSize],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:5000/api/products?isDeleted=false&page=${page}&limit=${pageSize}`
      );
      const resData = await response.json();
      return {
        data: resData.data,
        pagination: resData.pagination,
      };
    },
    placeholderData: keepPreviousData,
  });

  // Mutation cho xóa mềm
  const { mutate: softDeleteMutate } = useMutation({
    mutationFn: (id: string) => softDeleteProduct(id),
    onSuccess: () => {
      message.success("Xóa mềm sản phẩm thành công");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || "Xóa mềm sản phẩm thất bại"
      );
    },
  });

  // Lấy danh sách chất liệu
  useEffect(() => {
    if (!data?.data || data.data.length === 0) return;

    const fetchMaterials = async () => {
      const map: Record<string, string> = {};
      await Promise.all(
        data.data.map(async (product) => {
          try {
            const materialName = await getProductMaterials(product._id);
            map[product._id] = materialName || "Không có";
          } catch (err) {
            map[product._id] = "Lỗi";
          }
        })
      );
      setMaterialsMap(map);
    };

    fetchMaterials();
  }, [data?.data]);

  const handleEdit = (product: Product) => {
    navigate(`/admin/products/edit/${product._id}`);
  };

  const handleSoftDelete = (product: Product) => {
    softDeleteMutate(product._id);
  };

  const columns = [
    {
      title: "Ảnh",
      dataIndex: "image",
      key: "image",
      render: (images: string[]) => {
        const isFullUrl = (url: string) => /^https?:\/\//.test(url);
        const imageUrl =
          Array.isArray(images) && images.length > 0 && images[0]
            ? isFullUrl(images[0])
              ? images[0]
              : `http://localhost:5000${images[0]}`
            : "/placeholder.png";
        return (
          <Image
            width={60}
            height={60}
            style={{ objectFit: "cover", borderRadius: 8 }}
            src={imageUrl}
            alt="Product"
            placeholder
            fallback="/placeholder.png"
          />
        );
      },
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Mô tả ngắn",
      dataIndex: "descriptionShort",
      key: "descriptionShort",
      ellipsis: true,
    },
    {
      title: "Chất liệu",
      key: "material",
      render: (_: any, record: Product) =>
        materialsMap[record._id] || "Đang tải...",
    },
    {
      title: "Danh mục",
      dataIndex: "categoryId",
      key: "categoryId",
      render: (category: { name?: string }) => category?.name || "N/A",
    },
    {
      title: "Đã bán",
      dataIndex: "totalPurchased",
      key: "totalPurchased",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color =
          status === "active"
            ? "green"
            : status === "hidden"
              ? "orange"
              : "red";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => format(new Date(date), "PPp"),
    },
    {
      title: "Hành động",
      key: "actions",
      fixed: "right" as const,
      render: (_: unknown, record: Product) => (
        <Space>
          <Tooltip title="Biến thể">
            <Button
              icon={<BranchesOutlined />}
              onClick={() => navigate(`/admin/products/variants/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="primary"
              icon={<EditOutlined />}
              shape="circle"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa mềm">
            <Popconfirm
              title="Xác nhận xóa mềm sản phẩm?"
              onConfirm={() => handleSoftDelete(record)}
            >
              <Button danger icon={<DeleteOutlined />} shape="circle" />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="🛍️ Danh sách sản phẩm"
      extra={
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate("/admin/products/create")}
          >
            Thêm sản phẩm
          </Button>
          <Button
            type="default"
            icon={<HistoryOutlined />}
            onClick={() => navigate("/admin/products/restore")}
          >
            Khôi phục/Xóa vĩnh viễn
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={data?.data || []}
        loading={isLoading}
        rowKey="_id"
        scroll={{ x: "max-content" }}
        pagination={{
          current: data?.pagination.page || page,
          pageSize: data?.pagination.limit || pageSize,
          total: data?.pagination.total || 0,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]} - ${range[1]} trong tổng số ${total} sản phẩm`,
          onChange: (p, ps) => {
            if (ps !== pageSize) {
              setPage(1); // reset về trang 1 khi đổi pageSize
              setPageSize(ps);
            } else {
              setPage(p);
            }
          },
        }}
      />
    </Card>
  );
};

export default ProductList;
