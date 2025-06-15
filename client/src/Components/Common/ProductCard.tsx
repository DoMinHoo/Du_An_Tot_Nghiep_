import React, { useState, useEffect } from 'react';
import { fetchVariations } from '../../services/apiService';
import {
  formatPrice,
  calculateDiscount,
  isValidPrice,
} from '../../utils/priceUtils';
import { Link } from 'react-router-dom';
import type { Product } from '../../types/Product';
import type { Variation } from '../../types/Variations';
import { getImageUrl } from '../../utils/imageUtils';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [variation, setVariation] = useState<Variation | null>(null);
  const [loading, setLoading] = useState(true);

  // Sử dụng useEffect để lấy biến thể mặc định
  useEffect(() => {
    let isMounted = true;
    const fetchDefaultVariation = async () => {
      try {
        setLoading(true);
        const variations = await fetchVariations(product._id);
        // Kiểm tra xem variations có phải mảng và có phần tử không
        if (isMounted && Array.isArray(variations) && variations.length > 0) {
          setVariation(variations[0]);
        } else if (isMounted) {
          setVariation(null); // Không có biến thể
        }
      } catch {
        if (isMounted) {
          setVariation(null); // Lỗi API, không hiển thị
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Kiểm tra ID sản phẩm hợp lệ (ObjectId MongoDB)
    if (product._id && /^[0-9a-fA-F]{24}$/.test(product._id)) {
      fetchDefaultVariation();
    } else {
      setLoading(false);
      setVariation(null); // ID không hợp lệ, không hiển thị
    }

    return () => {
      isMounted = false;
    };
  }, [product._id]);

  // Nếu đang tải, hiển thị skeleton
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-[300px] rounded-md">
        <div className="h-[240px] bg-gray-300"></div>
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Nếu không có biến thể hoặc dữ liệu sản phẩm không hợp lệ, không hiển thị gì
  if (
    !variation ||
    !product._id ||
    !product.name ||
    !Array.isArray(product.image)
  ) {
    return null;
  }

  // Kiểm tra giá hợp lệ từ biến thể
  const effectiveSalePrice = isValidPrice(variation.salePrice)
    ? variation.salePrice
    : null;
  const effectiveFinalPrice = isValidPrice(variation.finalPrice)
    ? variation.finalPrice
    : null;

  // Nếu không có giá hợp lệ, không hiển thị
  if (!effectiveSalePrice && !effectiveFinalPrice) {
    return null;
  }

  // Tính phần trăm giảm giá
  const discountPercentage = calculateDiscount(
    effectiveSalePrice,
    effectiveFinalPrice
  );

  // Kiểm tra sản phẩm có mới không (trong 7 ngày)
  const isNew = product.createdAt
    ? new Date(product.createdAt) >
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    : false;

  return (
    <div className="relative w-full max-w-[300px] bg-white shadow-sm rounded-md overflow-hidden hover:shadow-md transition-all duration-300 text-sm">
      {isNew && (
        <div className="absolute top-2 right-2 z-10 bg-yellow-400 text-white text-sm font-semibold px-2 py-1 rounded shadow">
          New
        </div>
      )}
      {discountPercentage > 0 && (
        <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-sm px-2 py-1 rounded shadow">
          -{discountPercentage}%
        </div>
      )}
      <div className="relative group">
        <Link to={`/products/${product._id}`} title={product.name}>
          <img
            src={getImageUrl(product.image[0])}
            alt={product.name}
            className="w-full h-[240px] object-cover transition-opacity duration-300 group-hover:opacity-0"
            onError={(e) => (e.currentTarget.src = getImageUrl())}
          />
          <img
            src={getImageUrl(product.image[1] || product.image[0])}
            alt={`${product.name} - Hover`}
            className="w-full h-[240px] object-cover absolute top-0 left-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            onError={(e) => (e.currentTarget.src = getImageUrl())}
          />
        </Link>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-800 truncate">
          <Link
            to={`/products/${product._id}`}
            className="hover:text-blue-500 transition"
          >
            {product.name || 'Sản phẩm không tên'}
          </Link>
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-red-600 font-semibold text-base">
            {formatPrice(effectiveSalePrice || effectiveFinalPrice)}
          </span>
          {effectiveSalePrice && effectiveFinalPrice && (
            <del className="text-gray-400 text-xs">
              {formatPrice(effectiveFinalPrice)}
            </del>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
