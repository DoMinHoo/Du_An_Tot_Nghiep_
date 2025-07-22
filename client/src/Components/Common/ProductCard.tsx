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
import { Link, useNavigate } from 'react-router-dom';
import type { Product } from '../../types/Product'; // Sử dụng Product interface của bạn
import type { Variation } from '../../types/Variations';
import { getImageUrl } from '../../utils/imageUtils';
import { v4 as uuidv4 } from 'uuid';
import { addToCart } from '../../services/cartService';

// Import icon ngôi sao từ react-icons/md
import { MdStar, MdStarBorder } from 'react-icons/md';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [variation, setVariation] = useState<Variation | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVariations, setHasVariations] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  // Mutation để thêm sản phẩm vào giỏ hàng
  const addToCartMutation = useMutation({
    mutationFn: ({
      variationId,
      quantity,
    }: {
      variationId: string;
      quantity: number;
    }) => addToCart(variationId, quantity, token, guestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setShowSuccessToast(true);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi khi thêm vào giỏ hàng', {
        autoClose: 1000,
      });
    },
    onSettled: () => setIsUpdating(false),
  });

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = async () => {
    if (!hasVariations || !variation || variation.stockQuantity <= 0) {
      toast.error(
        !hasVariations || !variation
          ? 'Sản phẩm không có biến thể hợp lệ!'
          : 'Sản phẩm đã hết hàng!',
        { autoClose: 1000 }
      );
      return;
    }

    setIsUpdating(true);
    addToCartMutation.mutate({ variationId: variation._id, quantity: 1 });
  };

  // Xử lý thanh toán ngay
  const handleCheckout = async () => {
    if (!hasVariations || !variation || variation.stockQuantity <= 0) {
      toast.error(
        !hasVariations || !variation
          ? 'Sản phẩm không có biến thể hợp lệ!'
          : 'Sản phẩm đã hết hàng!',
        { autoClose: 1000 }
      );
      return;
    }

    setIsUpdating(true);
    try {
      await addToCartMutation.mutateAsync({
        variationId: variation._id,
        quantity: 1,
      });

      const imageUrl = variation.colorImageUrl
        ? getImageUrl(variation.colorImageUrl)
        : product.image && product.image.length > 0
          ? getImageUrl(product.image[0])
          : getImageUrl();

      const checkedItem = {
        variationId: {
          _id: variation._id,
          salePrice: variation.salePrice ?? 0,
          finalPrice: variation.finalPrice ?? 0,
          colorImageUrl: imageUrl,
          name: product.name || 'Unnamed Product',
          color: variation.colorName || 'Không xác định',
          stockQuantity: variation.stockQuantity || 0,
        },
        quantity: 1,
      };

      const totalPrice = (variation.salePrice || variation.finalPrice || 0) * 1;

      navigate('/checkout', {
        state: {
          selectedItems: [variation._id],
          cartItems: [checkedItem],
          totalPrice,
        },
      });
    } catch {
      // Lỗi đã được xử lý trong onError của mutation
    }
  };

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

  // Hàm render các ngôi sao đánh giá
  const renderStars = (rating: number | undefined) => {
    const stars = [];
    // Làm tròn số sao để hiển thị (ví dụ 4.7 -> 5 sao, 4.3 -> 4 sao)
    const roundedRating = rating ? Math.round(rating) : 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= roundedRating ? (
          <MdStar key={i} className="text-orange-500 text-xl" /> // Sao đầy, màu cam
        ) : (
          <MdStarBorder key={i} className="text-gray-300 text-xl" /> // Sao rỗng, màu xám
        )
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
        {/* Phần hiển thị đánh giá - ĐÃ THÊM VÀO ĐÂY */}
        {product.averageRating !== undefined && product.numOfReviews !== undefined && (
          <div className="flex items-center mt-2">
            <div className="flex">
              {renderStars(product.averageRating)}
            </div>
            {/* Hiển thị số lượt đánh giá bên cạnh số sao */}
            <span className="text-sm text-gray-500 ml-2">
              ({product.numOfReviews})
            </span>
          </div>
        )}
        {/* KẾT THÚC PHẦN ĐÁNH GIÁ */}

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
        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            onClick={handleAddToCart}
            disabled={
              isUpdating ||
              !hasVariations ||
              !variation ||
              variation.stockQuantity <= 0
            }
          >
            {isUpdating ? 'Đang thêm...' : 'Thêm vào giỏ'}
          </button>
          <button
            className="flex-1 bg-green-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
            onClick={handleCheckout}
            disabled={
              isUpdating ||
              !hasVariations ||
              !variation ||
              variation.stockQuantity <= 0
            }
          >
            {isUpdating ? 'Đang xử lý...' : 'Thanh toán'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;