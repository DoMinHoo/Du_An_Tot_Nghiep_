import React, { useEffect, useState } from 'react';
import ProductSection from '../Components/Common/ProductSection';
import ProductList from '../Components/Common/ProductList';
import type { Product } from '../types/Product';
import type { Variation } from '../types/Variations';

const HomePage = () => {
  const [newProducts, setNewProducts] = useState<(Product & Variation)[]>([]);
  const [hotProducts, setHotProducts] = useState<(Product & Variation)[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<(Product & Variation)[]>([]);

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
      <ProductSection title="Flash Sale" products={flashSaleProducts} />
      <ProductSection title="Sản phẩm mới" products={newProducts} filterType="new" />
      <ProductSection title="Bán chạy nhất" products={hotProducts} filterType="hot" />
      <ProductList />
    </div>
  );
};

export default HomePage;
