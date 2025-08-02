import React, { useEffect, useState, useRef } from 'react';
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
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await axios.get<{ success: boolean; data: Banner[] }>(
                    'http://localhost:5000/api/banners'
                );
                const activeBanners = res.data.data
                    .filter((b) => b.isActive)
                    .sort((a, b) => a.position - b.position);
                setBanners(activeBanners);
                setIndex(0);
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

    // Auto slide
    useEffect(() => {
        if (banners.length === 0) return;

        if (intervalRef.current) clearInterval(intervalRef.current);

        if (!isPaused) {
            intervalRef.current = setInterval(() => {
                setIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
            }, 5000);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [banners, isPaused]);

    if (banners.length === 0) return null;

    return (
        <div
            className="relative w-full overflow-hidden select-none"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Wrapper của carousel */}
            <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{
                    width: `${banners.length * 100}%`,
                    transform: `translateX(-${index * (100 / banners.length)}%)`,
                }}
            >
                {banners.map((banner) => (
                    <a
                        key={banner._id}
                        href={banner.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex-shrink-0"
                        style={{ width: `${100 / banners.length}%` }}
                    >
                        <img
                            src={
                                banner.image.startsWith('http')
                                    ? banner.image
                                    : `http://localhost:5000${banner.image}`
                            }
                            alt={banner.title}
                            className="w-full h-64 md:h-[500px] object-cover"
                        />
                    </a>
                ))}
            </div>

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

            {/* Pagination dots */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {banners.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        aria-label={`Chuyển tới banner thứ ${i + 1}`}
                        className={`w-3 h-3 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-gray-400/70'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default BannerSlider;
