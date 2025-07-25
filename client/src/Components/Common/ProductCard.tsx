import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import { v4 as uuidv4 } from 'uuid';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [variation, setVariation] = useState<Variation | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVariations, setHasVariations] = useState<boolean | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);;

  // Lấy token hoặc guestId từ sessionStorage
  const token = sessionStorage.getItem('token') || undefined;
  let guestId = sessionStorage.getItem('guestId') || undefined;

  // Tạo guestId mới nếu chưa có và chưa đăng nhập
  if (!token && !guestId) {
    guestId = uuidv4();
    sessionStorage.setItem('guestId', guestId);
  }

  // Tải thông tin biến thể của sản phẩm
  useEffect(() => {
    let isMounted = true;

    const checkVariations = async () => {
      try {
        setLoading(true);

        if (!product._id || !/^[0-9a-fA-F]{24}$/.test(product._id)) {
          if (isMounted) {
            setHasVariations(false);
            setLoading(false);
          }
          return;
        }

        const variations = await fetchVariations(product._id);

        if (isMounted) {
          if (Array.isArray(variations) && variations.length > 0) {
            const availableVariation = variations.find(
              (v) => v.stockQuantity > 0
            );
            setVariation(availableVariation || variations[0]);
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

    checkVariations();

    return () => {
      isMounted = false;
    };
  }, [product._id]);

  

  // Hiển thị toast khi thêm vào giỏ hàng thành công
  useEffect(() => {
    if (showSuccessToast) {
      toast.success('Thêm vào giỏ hàng thành công!', {
        autoClose: 1000,
        onClose: () => setShowSuccessToast(false),
      });
    }
  }, [showSuccessToast]);

  // Hiển thị giao diện loading
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 h-[360px] rounded-lg">
        <div className="h-[240px] bg-gray-200 rounded-t-lg"></div>
        <div className="p-4 space-y-3">
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Kiểm tra dữ liệu sản phẩm không hợp lệ
  if (!product._id || !product.name || !Array.isArray(product.image)) {
    return null;
  }

  // Xác định giá và trạng thái giảm giá
  const effectiveSalePrice =
    hasVariations &&
    variation &&
    isValidPrice(variation.salePrice) &&
    variation.salePrice != null &&
    variation.salePrice > 0
      ? variation.salePrice
      : null;
  const effectiveFinalPrice =
    hasVariations && variation && isValidPrice(variation.finalPrice)
      ? variation.finalPrice
      : null;

  // Không hiển thị nếu không có giá hợp lệ
  if (!effectiveFinalPrice) {
    return null;
  }

  // Xác định giá hiển thị và trạng thái giảm giá
  const displayPrice = effectiveSalePrice ?? effectiveFinalPrice;
  const hasDiscount =
    effectiveSalePrice &&
    effectiveFinalPrice &&
    effectiveSalePrice < effectiveFinalPrice;
  const discountPercentage = hasDiscount
    ? calculateDiscount(effectiveSalePrice, effectiveFinalPrice)
    : 0;

  // Kiểm tra sản phẩm mới
  const isNew = product.createdAt
    ? new Date(product.createdAt) >
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    : false;

  // --- Logic hiển thị số sao và đánh giá ---
  const averageRating = product.averageRating || 0; // Đảm bảo có giá trị mặc định
  const totalReviews = product.totalReviews || 0; // Đảm bảo có giá trị mặc định

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0; // Kiểm tra có phần thập phân

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg
          key={`full-${i}`}
          className="w-4 h-4 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
        </svg>
      );
    }
    if (hasHalfStar) {
      stars.push(
        <svg
          key="half"
          className="w-4 h-4 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Định nghĩa gradient cho sao nửa ở đây */}
          <defs>
            <linearGradient id="half-gradient">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" fill="url(#half-gradient)"></path>
        </svg>
      );
    }
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <svg
          key={`empty-${i}`}
          className="w-4 h-4 text-gray-300" // Màu xám cho sao rỗng
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
        </svg>
      );
    }
    return stars;
  };

  return (
    <div className="relative w-full max-w-[300px] bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <ToastContainer />
      {isNew && (
        <span className="absolute top-3 right-3 z-10 bg-yellow-400 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
          New
        </span>
      )}
      {hasDiscount && discountPercentage > 0 && (
        <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
          -{discountPercentage}%
        </span>
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
        <h3 className="text-lg font-semibold text-gray-800 truncate">
          <Link
            to={`/products/${product._id}`}
            className="hover:text-blue-600 transition-colors"
          >
            {product.name || 'Unnamed Product'}
          </Link>
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-red-600 font-bold text-lg">
            {formatPrice(displayPrice)}
          </span>
          {hasDiscount && effectiveFinalPrice && (
            <del className="text-gray-400 text-sm">
              {formatPrice(effectiveFinalPrice)}
            </del>
          )}
        </div>
        {/* HIỂN THỊ SỐ SAO TRUNG BÌNH VÀ TỔNG SỐ ĐÁNH GIÁ */}
        <div className="flex items-center mt-1 text-sm text-gray-600">
          <div className="flex -space-x-1 rtl:space-x-reverse">
            {renderStars(averageRating)}
          </div>
          <span className="ms-1 font-medium text-gray-500">
            {averageRating.toFixed(1)}
          </span>
          <span className="w-1 h-1 mx-1.5 bg-gray-500 rounded-full dark:bg-gray-400"></span>
          {/* Đã bỏ class underline và hover:no-underline */}
          <span className="text-gray-900">
            {totalReviews === 0 ? 'Chưa có đánh giá' : `(${totalReviews})`}
          </span>
        </div>
        {/* KẾT THÚC PHẦN HIỂN THỊ ĐÁNH GIÁ */}
      </div>
    </div>
  );
};

export default ProductCard;