// 📁 src/components/BannerSlider.jsx
import React, { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "../Components/Common/img/Banner/collection_page_3a776e1a5ea547539df37c6f8c378981_2048x2048.webp"
import "../Components/Common/img/Banner/slideshow_1_master.webp";
import "../Components/Common/img/Banner/slideshow_3.webp";
const banners = [
    {
        id: 1,
        image: "../Components/Common/img/Banner/collection_page_3a776e1a5ea547539df37c6f8c378981_2048x2048.webp",
        link: "#",
    },
    {
        id: 2,
        image: "../Components/Common/img/Banner/slideshow_1_master.webp",
        link: "#",
    },
    {
        id: 3,
        image: "../Components/Common/img/Banner/slideshow_3.webp",
        link: "#",
    },
];

const BannerSlider = () => {
    const [index, setIndex] = useState(0);

    const handlePrev = () => {
        setIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="relative w-full overflow-hidden">
            <div className="relative h-64 md:h-[400px]">
                <a href={banners[index].link}>
                    <img
                        src={banners[index].image}
                        alt="banner"
                        className="w-full h-full object-cover transition duration-500"
                    />
                </a>

                {/* Nút trái */}
                <button
                    onClick={handlePrev}
                    className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50"
                >
                    <FaChevronLeft />
                </button>

                {/* Nút phải */}
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
