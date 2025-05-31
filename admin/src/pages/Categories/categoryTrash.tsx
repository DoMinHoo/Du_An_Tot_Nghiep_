import React from "react";
import { Table, Button, Layout, Space, message } from "antd";


const { Content } = Layout;

// Dữ liệu giả lập
const trashData = [
  {
    key: "1",
    name: "Ghế Gỗ",
    description: "Danh mục nội thất",
    deletedAt: "2025-05-28 09:00",
  },
  {
    key: "2",
    name: "Bàn Làm Việc",
    description: "Danh mục bàn",
    deletedAt: "2025-05-27 15:30",
  },
];

const CategoryTrash: React.FC = () => {
  const handleRestore = (key: string) => {
    // gọi API khôi phục ở đây
    message.success(`Khôi phục danh mục có key: ${key}`);
  };

  const handleDelete = (key: string) => {
    // gọi API xóa vĩnh viễn ở đây
    message.error(`Xóa vĩnh viễn danh mục có key: ${key}`);
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "key",
      key: "key",
    },
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
      title: "Thời gian xóa",
      dataIndex: "deletedAt",
      key: "deletedAt",
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Button type="default" onClick={() => handleRestore(record.key)}>
            Khôi phục
          </Button>
          <Button danger onClick={() => handleDelete(record.key)}>
            Xóa vĩnh viễn
          </Button>
        </Space>
      ),
    },
  ];

  return (

        <Content style={{ margin: 24, background: "#fff", padding: 24 }}>
          <h2 style={{ marginBottom: 16 }}>Thùng rác danh mục</h2>
          <Table dataSource={trashData} columns={columns} pagination={false} />
        </Content>

  );
};

export default CategoryTrash;
