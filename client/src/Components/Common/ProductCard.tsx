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
  const [hasVariations, setHasVariations] = useState<boolean | null>(null);

  // Kiểm tra sản phẩm có biến thể hay không
  useEffect(() => {
    let isMounted = true;

    const checkVariations = async () => {
      try {
        setLoading(true);

        // Kiểm tra ID sản phẩm hợp lệ
        if (!product._id || !/^[0-9a-fA-F]{24}$/.test(product._id)) {
          if (isMounted) {
            setHasVariations(false);
            setLoading(false);
          }
          return;
        }

        // Gọi API fetchVariations
        const variations = await fetchVariations(product._id);

        if (isMounted) {
          if (Array.isArray(variations) && variations.length > 0) {
            setVariation(variations[0]);
            setHasVariations(true);
          } else {
            setVariation(null);
            setHasVariations(false);
          }
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setVariation(null);
          setHasVariations(false);
          setLoading(false);
        }
      }
    };

    // Chỉ gọi API nếu sản phẩm có ID hợp lệ
    if (product._id && /^[0-9a-fA-F]{24}$/.test(product._id)) {
      checkVariations();
    } else {
      setHasVariations(false);
      setLoading(false);
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

  // Nếu dữ liệu sản phẩm không hợp lệ, không hiển thị gì
  if (!product._id || !product.name || !Array.isArray(product.image)) {
    return null;
  }

  // Nếu sản phẩm không có biến thể, sử dụng giá từ product
  let effectiveSalePrice = null;
  let effectiveFinalPrice = null;

  if (hasVariations && variation) {
    effectiveSalePrice = isValidPrice(variation.salePrice)
      ? variation.salePrice ?? 0
      : null;
    effectiveFinalPrice = isValidPrice(variation.finalPrice)
      ? variation.finalPrice
      : null;
  } else {
    effectiveSalePrice = isValidPrice(product.salePrice)
      ? product.salePrice
      : null;
    effectiveFinalPrice = isValidPrice(product.finalPrice)
      ? product.finalPrice
      : null;
  }

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
          {effectiveSalePrice != 0 &&
            effectiveSalePrice &&
            effectiveFinalPrice && (
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
