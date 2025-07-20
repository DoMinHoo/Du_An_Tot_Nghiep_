import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ProductCard from '../Components/Common/ProductCard';
import type { Product } from '../types/Product';
import type { Variation } from '../types/Variations';

const ProductsPage: React.FC = () => {
  const location = useLocation();
  const [products, setProducts] = useState<(Product & Variation)[]>([]);
  const [title, setTitle] = useState('Tất cả sản phẩm');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const filter = params.get('filter');

        let url = 'http://localhost:5000/api/products?limit=100';

        if (filter === 'new') {
          url += '&filter=new';
          setTitle('Sản phẩm mới');
        } else if (filter === 'hot') {
          url += '&filter=hot';
          setTitle('Sản phẩm bán chạy');
        }

        const response = await fetch(url);
        const result = await response.json();

        setProducts(result.data || []);
      } catch (err) {
        console.error('Lỗi khi tải sản phẩm:', err);
      }
    };

    fetchProducts();
  }, [location.search]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">{title}</h1>
      {products.length === 0 ? (
        <p>Không có sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
