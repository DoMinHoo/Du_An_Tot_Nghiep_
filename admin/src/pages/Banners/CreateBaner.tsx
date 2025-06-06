import React, { useState } from 'react';
import { Form, Input, Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { createBanner } from '../../Services/banner.service';

const CreateBanner: React.FC = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const [fileList, setFileList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        if (fileList.length === 0) {
            return message.error('Vui lòng chọn ảnh');
        }

        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('link', values.link);
        formData.append('collection', values.collection);
        formData.append('image', fileList[0].originFileObj); // ảnh thực

        try {
            setLoading(true);
            await createBanner(formData);
            message.success('🎉 Tạo banner thành công!');
            navigate('/admin/banners');
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                'Tạo banner thất bại!';
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form layout="vertical" form={form} onFinish={onFinish}>
            <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
                <Input placeholder="Nhập tiêu đề banner" />
            </Form.Item>

            <Form.Item
                name="link"
                label="Liên kết"
                rules={[{ required: true, type: 'url', message: 'Link không hợp lệ' }]}
            >
                <Input placeholder="https://hoặc /collections/..." />
            </Form.Item>

            <Form.Item name="collection" label="Collection" rules={[{ required: true }]}>
                <Input placeholder="summer-sale, trending, ..." />
            </Form.Item>

            <Form.Item label="Ảnh banner" required>
                <Upload
                    beforeUpload={() => false}
                    fileList={fileList}
                    onChange={({ fileList }) => setFileList(fileList)}
                    listType="picture"
                    maxCount={1}
                >
                    <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                </Upload>
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                    Tạo mới
                </Button>
            </Form.Item>
        </Form>
    );
};

export default CreateBanner;
