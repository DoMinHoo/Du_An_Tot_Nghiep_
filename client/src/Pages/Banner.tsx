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
                // Lọc banner isActive = true và sắp xếp theo position
                const activeBanners = res.data.data
                    .filter(b => b.isActive)
                    .sort((a, b) => a.position - b.position);
                setBanners(activeBanners);
                setIndex(0); // reset index khi load mới
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
        <div className="relative w-full overflow-hidden select-none">
            <div className="relative h-64 md:h-[700px]">
                <a href={currentBanner.link} target="_blank" rel="noopener noreferrer">
                    <img
                        src={currentBanner.image.startsWith('http') ? currentBanner.image : `http://localhost:5000${currentBanner.image}`}
                        alt={currentBanner.title}
                        className="w-full h-full object-cover transition-transform duration-500 ease-in-out"
                    />
                </a>

                {/* Buttons */}
                <button
                    onClick={handlePrev}
                    aria-label="Previous Banner"
                    className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/60 transition"
                >
                    <FaChevronLeft />
                </button>

                <button
                    onClick={handleNext}
                    aria-label="Next Banner"
                    className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/60 transition"
                >
                    <FaChevronRight />
                </button>
            </div>

            {/* Pagination dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {banners.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        aria-label={`Chuyển tới banner thứ ${i + 1}`}
                        className={`w-3 h-3 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-gray-400'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default BannerSlider;
