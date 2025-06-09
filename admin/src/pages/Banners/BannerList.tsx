import React, { useEffect, useState } from 'react';
import { Table, Switch, Button, Popconfirm, message, Image, Space } from 'antd';
import { fetchAllBanners, deleteBanner, toggleVisibility } from '../../Services/banner.service';
import type { Banner } from '../../Types/banner.interface';
import { useNavigate } from 'react-router-dom';

const BannerList: React.FC = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const loadBanners = async () => {
        setLoading(true);
        const data = await fetchAllBanners();
        setBanners(data);
        setLoading(false);
    };

    useEffect(() => {
        loadBanners();
    }, []);

    const handleDelete = async (id: string) => {
        await deleteBanner(id);
        message.success('Deleted successfully');
        loadBanners();
    };

    const handleToggle = async (id: string, current: boolean) => {
        try {
            const updatedBanner = await toggleVisibility(id, !current);
            message.success('Updated visibility');

            setBanners(prev =>
                prev.map(banner => banner._id === id ? { ...banner, isActive: updatedBanner.isActive } : banner)
            );
        } catch (err) {
            message.error('Failed to update visibility');
        }
    };

    const columns = [
        {
            title: 'Image',
            dataIndex: 'image',
            render: (img: string) => {
                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const imageUrl = img?.startsWith('http') ? img : `${baseURL}${img}`;

                return (
                    <Image
                        width={100}
                        src={imageUrl}
                        alt="banner"
                        fallback="https://via.placeholder.com/100?text=No+Image"
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                    />
                );
            },
        },
        {
            title: 'Title',
            dataIndex: 'title',
        },
        {
            title: 'Position',
            dataIndex: 'position',
        },
        {
            title: 'Active',
            dataIndex: 'isActive',
            render: (_: any, record: Banner) => (
                <Switch checked={record.isActive} onChange={() => handleToggle(record._id, record.isActive)} />
            ),
        },
        {
            title: 'Actions',
            render: (_: any, record: Banner) => (
                <Space>
                    <Button type="link" onClick={() => navigate(`/admin/banners/edit/${record._id}`)}>
                        Edit
                    </Button>
                    <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record._id)}>
                        <Button danger>Delete</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button type="primary" onClick={() => navigate('/admin/banners/create')}>
                    Thêm Banner
                </Button>
            </div>
            <Table
                rowKey="_id"
                columns={columns}
                dataSource={banners}
                loading={loading}
            />
        </>
    );
};

export default BannerList;
