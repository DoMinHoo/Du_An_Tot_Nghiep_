import { Button, Input, Layout, Popconfirm, Space, Table, type PopconfirmProps } from "antd";
import React from "react";
import AddCategoryModal from "./addCategory";
import EditCategoryModal from "./editCategory";

const { Content } = Layout;

const dataSource = [
    {
        key: "1",
        name: "Ghế Gỗ",
    },
];

const columns = [
    {
        title: "STT",
        dataIndex: "key",
        key: "key",
    },
    {
        title: "NAME",
        dataIndex: "name",
        key: "name",
    },
    {
        title: "Action",
        key: "action",
        render: () => (
            <Space>
                <EditCategoryModal parentOptions={[]} />
                <Popconfirm
                    title="Delete the task"
                    description="Are you sure to delete this task?"
                    onConfirm={confirm}
                    onCancel={cancel}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button color="danger" variant="solid">
                        Delete
                    </Button>
                </Popconfirm>
            </Space>
        ),
    },
];


const confirm: PopconfirmProps['onConfirm'] = (e) => {

};

const cancel: PopconfirmProps['onCancel'] = (e) => {

};

const CategoryManager: React.FC = () => {
    return (

                <Content style={{ margin: "24px", background: "#fff", padding: 24 }}>
                    <div style={{ marginBottom: 16 }}>
                        <AddCategoryModal
                            parentOptions={[
                                { label: "Ghế", value: "661234abc" },
                                { label: "Bàn", value: "661234def" },
                            ]}
                        />
                    </div>
                    <Input placeholder="Tìm kiếm danh mục..." style={{ width: 300, marginBottom: 16 }} />
                    <Table dataSource={dataSource} columns={columns} pagination={false} />
                </Content>



    );
};

export default CategoryManager;
