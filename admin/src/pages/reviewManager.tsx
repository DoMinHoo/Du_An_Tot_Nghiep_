import React, { useState } from "react";
import {
  Layout,
  Table,
  Tag,
  Button,
  Space,
  Image,
  Input,
  message,
} from "antd";
import AdminHeader from "../components/header";
import AdminSidebar from "../components/sidebar";

const { Content } = Layout;

// Dữ liệu giả lập
const reviewData = [
  {
    key: "1",
    productId: "P001",
    userId: "U001",
    rating: 5,
    content: "Sản phẩm rất tốt!",
    images: ["https://via.placeholder.com/60"],
    createdAt: "2025-05-28 09:00",
    visible: true,
    flagged: false,
    replies: [
      {
        id: "r1",
        content: "Cảm ơn bạn đã đánh giá!",
        createdAt: "2025-05-28 10:00",
      },
    ],
  },
  {
    key: "2",
    productId: "P002",
    userId: "U002",
    rating: 2,
    content: "Hàng giao trễ, bị móp.",
    images: [],
    createdAt: "2025-05-27 15:30",
    visible: true,
    flagged: true,
    replies: [],
  },
];

const ReviewManager: React.FC = () => {
  const [data, setData] = useState(reviewData);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>(
    {}
  );

  const toggleVisibility = (key: string) => {
    setData((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, visible: !item.visible } : item
      )
    );
    message.success("Đã cập nhật hiển thị.");
  };

  const toggleFlag = (key: string) => {
    setData((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, flagged: !item.flagged } : item
      )
    );
    message.warning("Đã cập nhật trạng thái vi phạm.");
  };

  const handleReplyChange = (key: string, value: string) => {
    setReplyContent((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddReply = (reviewKey: string) => {
    const reply = replyContent[reviewKey]?.trim();
    if (!reply) return;

    setData((prev) =>
      prev.map((item) =>
        item.key === reviewKey
          ? {
              ...item,
              replies: [
                ...(item.replies || []),
                {
                  id: Date.now().toString(),
                  content: reply,
                  createdAt: new Date().toLocaleString(),
                },
              ],
            }
          : item
      )
    );
    setReplyContent((prev) => ({ ...prev, [reviewKey]: "" }));
    message.success("Đã thêm phản hồi.");
  };

  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "productId",
      key: "productId",
    },
    {
      title: "Người dùng",
      dataIndex: "userId",
      key: "userId",
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      key: "rating",
      render: (rating: number) => (
        <Tag color={rating >= 4 ? "green" : "orange"}>{rating} ★</Tag>
      ),
    },
    {
      title: "Nội dung",
      dataIndex: "content",
      key: "content",
    },
    {
      title: "Ảnh",
      dataIndex: "images",
      key: "images",
      render: (images: string[]) =>
        images.length > 0 ? (
          <Space>
            {images.map((src, i) => (
              <Image key={i} src={src} width={50} />
            ))}
          </Space>
        ) : (
          <span>-</span>
        ),
    },
    {
      title: "Ngày",
      dataIndex: "createdAt",
      key: "createdAt",
    },
    {
      title: "Hiển thị",
      dataIndex: "visible",
      key: "visible",
      render: (_: any, record: any) => (
        <Button onClick={() => toggleVisibility(record.key)}>
          {record.visible ? "Ẩn" : "Hiện"}
        </Button>
      ),
    },
    {
      title: "Vi phạm",
      dataIndex: "flagged",
      key: "flagged",
      render: (_: any, record: any) => (
        <Button
          danger={record.flagged}
          onClick={() => toggleFlag(record.key)}
        >
          {record.flagged ? "Bỏ đánh dấu" : "Đánh dấu"}
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <AdminSidebar />
      <Layout>
        <AdminHeader />
        <Content style={{ margin: 24, background: "#fff", padding: 24 }}>
          <h2 style={{ marginBottom: 16 }}>Quản lý đánh giá & phản hồi</h2>
          <Table
            columns={columns}
            dataSource={data}
            pagination={{ pageSize: 5 }}
            expandable={{
              expandedRowRender: (record) => (
                <div>
                  <strong>Phản hồi:</strong>
                  {record.replies?.length > 0 ? (
                    <ul style={{ paddingLeft: 16 }}>
                      {record.replies.map((reply: any) => (
                        <li key={reply.id}>
                          {reply.content}{" "}
                          <span style={{ color: "#999", marginLeft: 8 }}>
                            ({reply.createdAt})
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: "#999" }}>Chưa có phản hồi</p>
                  )}
                  <Input.TextArea
                    rows={2}
                    placeholder="Nhập phản hồi..."
                    style={{ marginTop: 8 }}
                    value={replyContent[record.key] || ""}
                    onChange={(e) =>
                      handleReplyChange(record.key, e.target.value)
                    }
                  />
                  <Button
                    type="primary"
                    onClick={() => handleAddReply(record.key)}
                    style={{ marginTop: 8 }}
                  >
                    Gửi phản hồi
                  </Button>
                </div>
              ),
            }}
          />
        </Content>
      </Layout>
    </Layout>
  );
};

export default ReviewManager;
