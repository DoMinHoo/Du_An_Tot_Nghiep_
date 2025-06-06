// src/pages/CollectionPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, Row, Col, Typography, Spin, Image } from 'antd';
import type { Banner } from '../../Types/banner.interface';

const { Title } = Typography;

const CollectionPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await axios.get<{ data: Banner[] }>(
                    `http://localhost:5000/api/banners/collection/${slug}`
                );
                setBanners(res.data.data);
            } catch (err) {
                console.error('Failed to fetch banners:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, [slug]);

    if (loading) return <Spin tip="Loading banners..." />;

    return (
        <>
            <Title level={2}>Collection: {slug}</Title>
            <Row gutter={[16, 16]}>
                {banners.map((banner) => (
                    <Col span={6} key={banner._id}>
                        <Card
                            hoverable
                            cover={
                                <Image
                                    alt={banner.title}
                                    src={`http://localhost:5000/${banner.image}`}
                                />
                            }
                        >
                            <Card.Meta title={banner.title} description={banner.link} />
                        </Card>
                    </Col>
                ))}
            </Row>
        </>
    );
};

export default CollectionPage;
