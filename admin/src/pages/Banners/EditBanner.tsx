import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const EditBanner: React.FC = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [fileList, setFileList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [originalImage, setOriginalImage] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchBanner = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/banners/${id}`);
                const banner = res.data.data;

                form.setFieldsValue({
                    title: banner.title,
                    link: banner.link,
                    position: banner.position,
                    collection: banner.collection,
                });

                if (banner.image) {
                    const fullImageUrl = `http://localhost:5000/${banner.image}`;
                    setOriginalImage(fullImageUrl); // Lưu ảnh gốc
                    setFileList([
                        {
                            uid: '-1',
                            name: 'banner-image',
                            status: 'done',
                            url: fullImageUrl,
                        },
                    ]);
                }
            } catch (err) {
                message.error('Không lấy được thông tin banner');
            }
        };

        fetchBanner();
    }, [id, form]);

    const onFinish = async (values: any) => {
        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('link', values.link);
        formData.append('position', values.position);
        formData.append('collection', values.collection);

        // Kiểm tra nếu có ảnh mới
        const newFile = fileList[0];
        const isUpdated = newFile && newFile.originFileObj;

        if (isUpdated) {
            formData.append('image', newFile.originFileObj);
        }

        try {
            setLoading(true);
            await axios.patch(`http://localhost:5000/api/banners/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            message.success('🎉 Cập nhật banner thành công!');
            navigate('/admin/banners');
        } catch (error: any) {
            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                'Thêm banner thất bại!';
            message.error(msg); // ✅ hiện lỗi cho người dùng
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form layout="vertical" form={form} onFinish={onFinish}>
            <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
                <Input />
            </Form.Item>

            <Form.Item
                name="link"
                label="Link"
                rules={[{ type: 'url', message: 'Link không hợp lệ' }]}
            >
                <Input />
            </Form.Item>

            <Form.Item name="collection" label="Collection" rules={[{ required: true }]}>
                <Input />
            </Form.Item>

            <Form.Item name="position" label="Vị trí" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Ảnh">
                <Upload
                    beforeUpload={() => false}
                    fileList={fileList}
                    onChange={({ fileList }) => setFileList(fileList)}
                    listType="picture"
                    maxCount={1}
                >
                    <Button icon={<UploadOutlined />}>Chọn ảnh mới</Button>
                </Upload>
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                    Cập nhật
                </Button>
            </Form.Item>
        </Form>
    );
};

export default EditBanner;
