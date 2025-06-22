import React, { useEffect, useState } from "react";
import {
  Layout,
  Table,
  Tag,
  Button,
  Space,
  Image,
  Input,
  message,
  Spin,
} from "antd";
import {
  getAllReviews,
  toggleReviewVisibility,
  toggleReviewFlag,
  replyToReview,
} from "../../Services/review.service"; // các API cần được định nghĩa

const { Content } = Layout;

const ReviewManager: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});

  // Load toàn bộ đánh giá
  const loadReviews = async () => {
    setLoading(true);
    try {
      const res = await getAllReviews();
      const formatted = res.map((item: any) => ({
        ...item,
        key: item._id,
        productId: item.product?.name || item.product,
        userId: item.user?.name || item.user,
        content: item.comment,
        images: item.images || [],
        replies: item.replies || [],
        visible: item.visible,
        flagged: item.flagged,
      }));
      setData(formatted);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách đánh giá.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  // Toggle hiển thị
  const toggleVisibility = async (id: string, current: boolean) => {
    try {
      await toggleReviewVisibility(id, !current);
      setData((prev) =>
        prev.map((item) =>
          item.key === id ? { ...item, visible: !current } : item
        )
      );
      message.success(`Đã ${!current ? "hiện" : "ẩn"} đánh giá.`);
    } catch (err) {
      console.error(err);
      message.error("Không thể cập nhật hiển thị.");
    }
  };

  // Toggle đánh dấu vi phạm
  const toggleFlag = async (id: string, current: boolean) => {
    try {
      await toggleReviewFlag(id, !current);
      setData((prev) =>
        prev.map((item) =>
          item.key === id ? { ...item, flagged: !current } : item
        )
      );
      message.success(`Đã ${!current ? "đánh dấu" : "bỏ đánh dấu"} vi phạm.`);
    } catch (err) {
      console.error(err);
      message.error("Không thể cập nhật trạng thái vi phạm.");
    }
  };

  // Xử lý phản hồi
  const handleReplyChange = (key: string, value: string) => {
    setReplyContent((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddReply = async (reviewId: string) => {
    const reply = replyContent[reviewId]?.trim();
    if (!reply) return;

    try {
      await replyToReview(reviewId, reply);
      setData((prev) =>
        prev.map((item) =>
          item.key === reviewId
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
      setReplyContent((prev) => ({ ...prev, [reviewId]: "" }));
      message.success("Đã thêm phản hồi.");
    } catch (err) {
      console.error(err);
      message.error("Không thể thêm phản hồi.");
    }
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
      render: (createdAt: string) => (
        <span>{new Date(createdAt).toLocaleString()}</span>
      ),
    },
    {
      title: "Hiển thị",
      dataIndex: "visible",
      key: "visible",
      render: (_: any, record: any) => (
        <Button onClick={() => toggleVisibility(record.key, record.visible)}>
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
          onClick={() => toggleFlag(record.key, record.flagged)}
        >
          {record.flagged ? "Bỏ đánh dấu" : "Đánh dấu"}
        </Button>
      ),
    },
  ];

  return (
    <Content style={{ margin: 24, background: "#fff", padding: 24 }}>
      <h2 style={{ marginBottom: 16 }}>Quản lý đánh giá & phản hồi</h2>
      {loading ? (
        <Spin size="large" />
      ) : (
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
      )}
    </Content>
  );
};

export default ReviewManager;
