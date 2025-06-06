import React, { useEffect, useState } from 'react';
import ProductSection from '../Components/Common/ProductSection';

const HomePage = () => {
    const [newProducts, setNewProducts] = useState([]);
    const [hotProducts, setHotProducts] = useState([]);
    const [flashSaleProducts, setFlashSaleProducts] = useState([]);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                // Đổi URL nếu bạn không dùng proxy
                const [resNew, resHot, resFlash] = await Promise.all([
                    fetch('http://localhost:5000/api/products?filter=new&limit=8'),
                    fetch('http://localhost:5000/api/products?filter=hot&limit=8'),
                    fetch('http://localhost:5000/api/products?flashSaleOnly=true&limit=8'),
                ]);

                const [dataNew, dataHot, dataFlash] = await Promise.all([
                    resNew.json(),
                    resHot.json(),
                    resFlash.json(),
                ]);

                setNewProducts(dataNew.data || []);
                setHotProducts(dataHot.data || []);
                setFlashSaleProducts(dataFlash.data || []);
            } catch (err) {
                console.error('Lỗi khi gọi API trang chủ:', err);
            }
        };

        fetchAll();
    }, []);

    return (
        <div className="container mx-auto px-4 py-6">
            <ProductSection title=" Flash Sale" products={flashSaleProducts} />
            <ProductSection title=" Sản phẩm mới" products={newProducts} />
            <ProductSection title=" Bán chạy nhất" products={hotProducts} />
        </div>
    );
};

export default HomePage;
