    import React, { useEffect, useState } from 'react';
    import ProductSection from '../Components/Common/ProductSection';
    import ProductList from '../Components/Common/ProductList';

    const HomePage = () => {
    const [newProducts, setNewProducts] = useState([]);
    const [hotProducts, setHotProducts] = useState([]);
    const [flashSaleProducts, setFlashSaleProducts] = useState([]);

    useEffect(() => {
        const fetchAll = async () => {
        try {
            const baseUrl = 'http://localhost:5000/api/products?limit=8';

            const urls = [
            `${baseUrl}&filter=new`,
            `${baseUrl}&filter=hot`,
            `${baseUrl}&flashSaleOnly=true`,
            ];

            const [resNew, resHot, resFlash] = await Promise.all(
            urls.map((url) => fetch(url))
            );

            const [dataNew, dataHot, dataFlash] = await Promise.all([
            resNew.json(),
            resHot.json(),
            resFlash.json(),
            ]);

            setNewProducts(dataNew.data || []);
            setHotProducts(dataHot.data || []);
            setFlashSaleProducts(dataFlash.data || []);
        } catch (err) {
            console.error('Lỗi khi load sản phẩm:', err);
        }
        };

        fetchAll();
    }, []);

    return (
        <div className="container mx-auto px-4 py-6">
        <ProductSection title=" Flash Sale" products={flashSaleProducts} />
        <ProductSection title=" Sản phẩm mới" products={newProducts} />
        <ProductSection title=" Bán chạy nhất" products={hotProducts} />
        <ProductList />
        </div>
    );
    };

    export default HomePage;
