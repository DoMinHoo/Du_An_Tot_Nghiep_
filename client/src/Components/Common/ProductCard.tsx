import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { v4 as uuidv4 } from 'uuid';
import { fetchVariations } from '../../services/apiService';
import type { Product } from '../../types/Product';
import type { Variation } from '../../types/Variations';
import { getImageUrl } from '../../utils/imageUtils';
import {
  calculateDiscount,
  formatPrice,
  isValidPrice,
} from '../../utils/priceUtils';

// Import icon ngôi sao từ react-icons/md
import { MdStar, MdStarBorder } from 'react-icons/md';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [variation, setVariation] = useState<Variation | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVariations, setHasVariations] = useState<boolean | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

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

  // Kiểm tra xem sản phẩm đã yêu thích chưa
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(product._id));
  }, [product._id]);

  // Toggle yêu thích
  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let updatedFavorites;

    if (favorites.includes(product._id)) {
      updatedFavorites = favorites.filter((id: string) => id !== product._id);
      setIsFavorite(false);
    } else {
      updatedFavorites = [...favorites, product._id];
      setIsFavorite(true);
    }

    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

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

  if (!product._id || !product.name || !Array.isArray(product.image)) {
    return null;
  }

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

  if (!effectiveFinalPrice) {
    return null;
  }

  const displayPrice = effectiveSalePrice ?? effectiveFinalPrice;
  const hasDiscount =
    effectiveSalePrice &&
    effectiveFinalPrice &&
    effectiveSalePrice < effectiveFinalPrice;
  const discountPercentage = hasDiscount
    ? calculateDiscount(effectiveSalePrice, effectiveFinalPrice)
    : 0;

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

      {/* Badge NEW */}
      {isNew && (
        <span className="absolute top-3 right-3 z-10 bg-yellow-400 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
          New
        </span>
      )}

      {/* Badge Giảm giá */}
      {hasDiscount && discountPercentage > 0 && (
        <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
          -{discountPercentage}%
        </span>
      )}




      {/* Nút yêu thích ở góc dưới bên phải card */}


      {/* Hình ảnh sản phẩm */}
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

      {/* Nội dung */}
      <div className="p-4 pb-2">
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
      </div>

      {/* Nút yêu thích ở góc dưới bên phải card */}
      <div className="absolute bottom-3 right-3 z-20">
        <button
          onClick={toggleFavorite}
          className="bg-white rounded-full p-2 shadow hover:bg-gray-100 transition-colors"
          title={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
        >
          {isFavorite ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 fill-current" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;