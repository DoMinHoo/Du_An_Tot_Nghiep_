import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import ProductSection from '../Components/Common/ProductSection';

interface Product {
  _id: string;
  name: string;
  image: string[];
  price?: number;
  descriptionShort?: string;
}

const SearchPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const keyword = query.get('keyword');

  useEffect(() => {
    if (keyword) {
      setLoading(true);
      axios
        .get(`http://localhost:5000/api/products/search/keyword?keyword=${encodeURIComponent(keyword)}`)
        .then((res) => {
          setProducts(res.data);
          setNotFound(res.data.length === 0);
        })
        .catch((err) => {
          console.error('Lỗi tìm kiếm:', err);
          setNotFound(true);
        })
        .finally(() => setLoading(false));
    }
  }, [keyword]);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">
        Kết quả tìm kiếm cho: "<span className="text-blue-600">{keyword}</span>"
      </h1>

      {loading && <p>Đang tải kết quả...</p>}

      {!loading && notFound && (
        <p className="text-red-500">Không tìm thấy sản phẩm nào phù hợp.</p>
      )}

      {!loading && products.length > 0 && (
        <ProductSection title="Kết quả tìm kiếm" products={products} />
      )}
    </div>
  );
};

export default SearchPage;
