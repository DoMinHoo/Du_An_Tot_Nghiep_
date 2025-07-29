import React, { useEffect, useState } from 'react';
import ProductCard from '../Components/Common/ProductCard';
import { fetchProduct } from '../services/apiService';
import type { Product } from '../types/Product';

const FavoriteProductsPage: React.FC = () => {
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      const favoriteIds = JSON.parse(localStorage.getItem('favorites') || '[]');
      const products: Product[] = [];
      for (const id of favoriteIds) {
        try {
          const product = await fetchProduct(id);
          if (product) products.push(product);
        } catch {
          // Có thể log lỗi nếu cần
        }
      }
      setFavoriteProducts(products);
      setLoading(false);
    };
    fetchFavorites();
  }, []);

  if (loading) {
    return <div className="text-center py-10">Đang tải sản phẩm yêu thích...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">Sản phẩm yêu thích</h2>
      {favoriteProducts.length === 0 ? (
        <div className="text-gray-500">Bạn chưa có sản phẩm yêu thích nào.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favoriteProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoriteProductsPage;
