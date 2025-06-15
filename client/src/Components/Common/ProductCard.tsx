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
  product: Product & Variation;
}
// San phẩm có thể có các biến thể, vì vậy chúng ta kết hợp kiểu Product và Variation
const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [variation, setVariation] = useState<Variation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Sử dụng useState để quản lý trạng thái của biến thể, trạng thái tải và lỗi
  // Sử dụng useEffect để tải biến thể mặc định khi sản phẩm được cung cấp
  useEffect(() => {
    let isMounted = true;
    const fetchDefaultVariation = async () => {
      try {
        setLoading(true);
        const variations = await fetchVariations(product._id);
        const defaultVariation = variations[0] || null;

        if (isMounted) {
          setVariation(defaultVariation);
          if (!defaultVariation && !isValidPrice(product.salePrice)) {
            setError(
              'Không tìm thấy biến thể hoặc giá hợp lệ cho sản phẩm này'
            );
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.message ||
              'Lỗi khi tải biến thể sản phẩm. Vui lòng thử lại sau.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (product._id && /^[0-9a-fA-F]{24}$/.test(product._id)) {
      fetchDefaultVariation();
    } else {
      setError('ID sản phẩm không hợp lệ');
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [product._id]);

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

  if (error || !product._id || !product.name || !Array.isArray(product.image)) {
    return (
      <div className="text-center text-red-500 p-4">
        {error || 'Dữ liệu sản phẩm không hợp lệ'}{' '}
        <Link to="/contact" className="text-blue-500 underline">
          Liên hệ
        </Link>
      </div>
    );
  }
  // Kiểm tra xem sản phẩm có ID, tên và hình ảnh hợp lệ hay không
  const getNumberValue = (value: any): number | null => {
    return typeof value === 'number' ? value : null;
  };

  const effectiveSalePrice =
    variation && isValidPrice(variation.salePrice)
      ? getNumberValue(variation.salePrice)
      : null;

  const effectiveFinalPrice =
    variation && isValidPrice(variation.finalPrice)
      ? getNumberValue(variation.finalPrice)
      : null;

  if (!effectiveSalePrice && !effectiveFinalPrice) {
    return (
      <div className="text-center text-red-500 p-4">
        Không có thông tin giá hợp lệ.{' '}
        <Link to="/contact" className="text-blue-500 underline">
          Liên hệ
        </Link>
      </div>
    );
  }
  // Nếu không có giá bán, sử dụng giá cuối cùng
  const discountPercentage = calculateDiscount(
    effectiveSalePrice,
    effectiveFinalPrice
  );
  // Tính toán phần trăm giảm giá nếu có
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
