import React, { useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';

interface Banner {
    _id: string;
    title: string;
    image: string;
    link: string;
    position: number;
    isActive: boolean;
    collection?: string;
}

const BannerSlider: React.FC = () => {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [index, setIndex] = useState<number>(0);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await axios.get<{ success: boolean; data: Banner[] }>(
                    'http://localhost:5000/api/banners'
                );
                const sorted = res.data.data.sort((a, b) => a.position - b.position);
                setBanners(sorted);
            } catch (err) {
                console.error('Lỗi khi lấy banner:', err);
            }
        };

        fetchBanners();
    }, []);

    const handlePrev = () => {
        setIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    };

    if (banners.length === 0) return null;

    const currentBanner = banners[index];

    return (
        <div className="relative w-full overflow-hidden">
            <div className="relative h-64 md:h-[700px]">
                <a href={currentBanner.link}>
                    <img
                        src={`http://localhost:5000/${currentBanner.image}`}
                        alt={currentBanner.title}
                        className="w-full h-full object-cover transition duration-500"
                    />
                </a>

                <button
                    onClick={handlePrev}
                    className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50"
                >
                    <FaChevronLeft />
                </button>

                <button
                    onClick={handleNext}
                    className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50"
                >
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
};

export default BannerSlider;
