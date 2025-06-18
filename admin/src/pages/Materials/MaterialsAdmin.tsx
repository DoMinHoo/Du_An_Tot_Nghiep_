import React, { useEffect, useState } from "react";
import {
    Table,
    Button,
    Space,
    Popconfirm,
    message,
    Typography
} from "antd";
import {
    getMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial
} from "../../Services/materials.service";
import MaterialFormModal from "../../components/Layout/MaterialFormModal";
import type { Material } from "../../Types/materials.interface";

const { Title } = Typography;

const MaterialAdmin: React.FC = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [totalItems, setTotalItems] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);

    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

    const fetchMaterials = async (page = 1) => {
        setLoading(true);
        try {
            const res = await getMaterials(page);
            setMaterials(res.data);
            setTotalItems(res.totalItems);
            setCurrentPage(res.currentPage);
        } catch (err) {
            message.error("Lỗi khi lấy dữ liệu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const handleAdd = () => {
        setEditingMaterial(null);
        setModalVisible(true);
    };

    const handleEdit = (record: Material) => {
        setEditingMaterial(record);
        setModalVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteMaterial(id);
            message.success("Đã xóa!");
            fetchMaterials(currentPage);
        } catch (err) {
            message.error("Lỗi khi xóa.");
        }
    };

    const handleSubmit = async (values: { name: string }) => {
        try {
            if (editingMaterial) {
                await updateMaterial(editingMaterial._id, values);
                message.success("Cập nhật thành công");
            } else {
                await createMaterial(values);
                message.success("Thêm mới thành công");
            }
            setModalVisible(false);
            fetchMaterials(currentPage);
        } catch (err: any) {
            message.error(err?.response?.data?.message || "Lỗi khi lưu.");
        }
    };

    const columns = [
        {
            title: "Tên chất liệu",
            dataIndex: "name",
            key: "name"
        },
        {
            title: "Hành động",
            key: "action",
            render: (_: any, record: Material) => (
                <Space>
                    <Button onClick={() => handleEdit(record)} type="link">Sửa</Button>
                    <Popconfirm
                        title="Xác nhận xóa?"
                        onConfirm={() => handleDelete(record._id)}
                    >
                        <Button danger type="link">Xóa</Button>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Quản lý Chất Liệu</Title>
            <Button type="primary" onClick={handleAdd} style={{ marginBottom: 16 }}>
                Thêm mới
            </Button>
            <Table
                rowKey="_id"
                columns={columns}
                dataSource={materials}
                loading={loading}
                pagination={{
                    current: currentPage,
                    pageSize: 10,
                    total: totalItems,
                    onChange: fetchMaterials
                }}
            />
            <MaterialFormModal
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                onFinish={handleSubmit}
                initialValues={editingMaterial}
            />
        </div>
    );
};

export default MaterialAdmin;
