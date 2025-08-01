// ProductDetail.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchProduct, fetchVariations } from '../services/apiService';
import { addToCart } from '../services/cartService';
import { formatPrice, isValidPrice } from '../utils/priceUtils';
import { getImageUrl } from '../utils/imageUtils';
import type { Product } from '../types/Product';
import type { Variation } from '../types/Variations';
import type { Review } from '../types/Review';
import { MdNavigateNext } from 'react-icons/md';
import { createReview } from '../services/reviewService';
import { useQuery } from '@tanstack/react-query';
import { getReviewsByProduct } from '../services/reviewService';
import { v4 as uuidv4 } from 'uuid';
import { FaUserCircle } from 'react-icons/fa'; // Import icon người dùng
import { FaBuilding } from 'react-icons/fa'; // Import icon công ty/admin

interface PriceAndStockDetails {
  salePrice: number;
  originalPrice: number;
  displayPrice: number;
  stockQuantity?: number;
  discountPercentage: number | null; // 
}

const getPriceAndStockDetails = (
  product: Product | undefined,
  selectedVariation: Variation | null
): PriceAndStockDetails => {
  const salePrice = selectedVariation?.salePrice ?? 0;
  const originalPrice = selectedVariation?.finalPrice ?? 0;
  const displayPrice = salePrice !== 0 ? salePrice : originalPrice;
  const stockQuantity = selectedVariation?.stockQuantity;

  let discountPercentage: number | null = null;
  if (
    isValidPrice(salePrice) &&
    isValidPrice(originalPrice) &&
    salePrice !== 0 &&
    salePrice < originalPrice
  ) {
    discountPercentage = Math.round(
      ((originalPrice - salePrice) / originalPrice) * 100
    );
  }

  return {
    salePrice,
    originalPrice,
    displayPrice,
    stockQuantity,
    discountPercentage,
  };
};

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(
    null
  );
  const [mainImage, setMainImage] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [isImageViewOpen, setIsImageViewOpen] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(
    null
  );
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const token = sessionStorage.getItem('token') || undefined;
  let guestId = sessionStorage.getItem('guestId') || undefined;

  // Tạo guestId mới nếu chưa có và chưa đăng nhập
  if (!token && !guestId) {
    guestId = uuidv4();
    sessionStorage.setItem('guestId', guestId);
  }

  const MAX_COMMENT_LENGTH = 500; // Giới hạn ký tự cho nhận xét

  const handleSubmitReview = async () => {
    if (!token) {
      toast.warning('Bạn cần đăng nhập để đánh giá!');
      return;
    }

    if (!rating || comment.trim() === '') {
      toast.warning('Vui lòng nhập đầy đủ nội dung và đánh giá sao!');
      return;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      toast.warning(
        `Nhận xét không được vượt quá ${MAX_COMMENT_LENGTH} ký tự.`
      );
      return;
    }

    try {
      setIsSubmittingReview(true);
      await createReview({
        product: id!,
        rating,
        comment,
      });
      toast.success('Gửi đánh giá thành công!');
      setRating(0);
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['reviews', id] });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Lỗi khi gửi đánh giá');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Sử dụng Review[] làm kiểu dữ liệu cho reviews
  const { data: reviews = [], refetch: refetchReviews } = useQuery<Review[]>({
    queryKey: ['reviews', id],
    queryFn: () => getReviewsByProduct(id!),
    enabled: !!id,
  });

  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-10 text-center text-red-600">
        ID sản phẩm không hợp lệ
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  const [productQuery, variationsQuery] = useQueries({
    queries: [
      {
        queryKey: ['product', id],
        queryFn: () => fetchProduct(id),
        retry: 2,
      },
      {
        queryKey: ['variations', id],
        queryFn: () => fetchVariations(id),
        retry: 2,
        onError: () => {
          toast.info(
            'Sản phẩm này không có biến thể hoặc lỗi khi tải biến thể',
            {
              autoClose: 1000,
            }
          );
        },
      },
    ],
  });

  const product = productQuery.data;
  const variations = variationsQuery.data || [];
  const isLoading = productQuery.isLoading || variationsQuery.isLoading;
  const error = productQuery.error || variationsQuery.error;

  const allImages = useMemo(() => {
    const productImages = Array.isArray(product?.image) ? product.image : [];
    const variationImages = variations
      .map((v) => v.colorImageUrl)
      .filter((url): url is string => !!url);

    const uniqueImages = Array.from(
      new Set([...variationImages, ...productImages])
    );
    return uniqueImages.map(getImageUrl);
  }, [product, variations]);

  const details = useMemo(
    () => getPriceAndStockDetails(product, selectedVariation),
    [product, selectedVariation]
  ); // Tính toán giá và tồn kho dựa trên sản phẩm và biến thể đã chọn

  useEffect(() => {
    if (variations.length > 0 && !selectedVariation) {
      setSelectedVariation(variations[0]);// Mặc định chọn biến thể đầu tiên
      setMainImage(
        variations[0].colorImageUrl
          ? getImageUrl(variations[0].colorImageUrl)
          : product?.image?.[0]
          ? getImageUrl(product.image[0])
          : getImageUrl()
      ); 
    } else if (product && !selectedVariation) {
      setMainImage(
        product.image?.[0] ? getImageUrl(product.image[0]) : getImageUrl()
      ); // Nếu không có biến thể, sử dụng ảnh sản phẩm đầu tiên
    } 
    if (variations.length === 0 && !variationsQuery.isLoading) {
      toast.info('Sản phẩm này không có biến thể.', { autoClose: 1000 });
    }
  }, [variations, product, selectedVariation, variationsQuery.isLoading]); // Thiết lập ảnh chính và biến thể mặc định khi tải xong

  const handleVariationSelect = (variation: Variation) => {
    setSelectedVariation(variation);
    setMainImage(
      variation.colorImageUrl
        ? getImageUrl(variation.colorImageUrl)
        : product?.image?.[0]
        ? getImageUrl(product.image[0])
        : getImageUrl()
    );
    setQuantity('1');
  };

  const increaseQty = () => {
    const parsedQty = parseInt(quantity, 10);
    if (!isNaN(parsedQty)) {
      setQuantity((parsedQty + 1).toString());
    } else {
      setQuantity('1');
    }
  };

  const decreaseQty = () => {
    const parsedQty = parseInt(quantity, 10);
    if (!isNaN(parsedQty) && parsedQty > 1) {
      setQuantity((parsedQty - 1).toString());
    } else {
      setQuantity('1');
    }
  };

  const openImageView = () => setIsImageViewOpen(true);
  const closeImageView = () => {
    setIsImageViewOpen(false);
    setCurrentImageIndex(0);
    setSlideDirection(null);
  };

  const nextImage = () => {
    if (allImages && currentImageIndex < allImages.length - 1) {
      setSlideDirection('left');
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setSlideDirection('right');
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isImageViewOpen) return;
      if (event.key === 'ArrowRight') {
        nextImage();
      } else if (event.key === 'ArrowLeft') {
        prevImage();
      } else if (event.key === 'Escape') {
        closeImageView();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageViewOpen, currentImageIndex]);

  //tieng viet: thêm vào giỏ hàng
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
      toast.success('Thêm vào giỏ hàng thành công!', { autoClose: 1000 });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lỗi khi thêm vào giỏ hàng', {
        autoClose: 1000,
      });
      console.error('Lỗi addToCart:', err);
    },
    onSettled: () => setIsUpdating(false),
  });

  const handleBuyNow = async () => {
    if (!selectedVariation) {
      toast.error('Vui lòng chọn biến thể sản phẩm!', { autoClose: 1000 });
      return;
    }
    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty < 1) {
      toast.error('Số lượng phải là số nguyên lớn hơn 0!', { autoClose: 1000 });
      setQuantity('1');
      return;
    }
    if (parsedQty > (selectedVariation.stockQuantity || 0)) {
      toast.error(
        `Số lượng vượt quá tồn kho (${selectedVariation.stockQuantity} đơn vị)!`,
        { autoClose: 1000 }
      );
      return;
    }
    setIsUpdating(true);
    try {
      const imageUrl = getImageUrl(selectedVariation.colorImageUrl);
      const checkedItem = {
        variationId: {
          _id: selectedVariation._id,
          salePrice: selectedVariation.salePrice ?? 0, //
          finalPrice: selectedVariation.finalPrice ?? 0,
          colorImageUrl: imageUrl,
          name: selectedVariation.name,
          material: {
            name:
              typeof selectedVariation.material === 'object'
                ? selectedVariation.material.name
                : selectedVariation.material,
          },
          colorName: selectedVariation.colorName || 'Không xác định',
          stockQuantity: selectedVariation.stockQuantity || 0,
          productId: selectedVariation._id, // Thêm productId để backend kiểm tra
        },
        quantity: parsedQty,
      };

      const totalPrice =
        (selectedVariation.salePrice || selectedVariation.finalPrice || 0) *
        parsedQty;

      navigate('/checkout', {
        state: {
          selectedItems: [selectedVariation._id],
          cartItems: [checkedItem],
          totalPrice,
          isDirectPurchase: true, // Thêm flag để báo hiệu mua trực tiếp
        },
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="animate-pulse">
            <div className="h-[500px] bg-gray-300 rounded"></div>
            <div className="flex gap-2 mt-4">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="w-16 h-16 bg-gray-300 rounded"></div>
                ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="h-6 bg-gray-300 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            <div className="flex gap-4">
              <div className="h-10 bg-gray-300 rounded w-24"></div>
              <div className="h-10 bg-gray-300 rounded w-32"></div>
              <div className="h-10 bg-gray-300 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    const errorMessage = (error as Error)?.message || 'Không tìm thấy sản phẩm';
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-10 text-center text-red-600">
        <p>{errorMessage}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      <ToastContainer />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex lg:flex-col gap-2 overflow-y-auto max-h-[500px]">
            {allImages.map((src, idx) => (
              <img
                key={idx}
                src={getImageUrl(src)}
                onClick={() => setMainImage(getImageUrl(src))}
                className={`w-16 h-16 object-cover rounded cursor-pointer border-2 transition-all ${
                  mainImage === getImageUrl(src)
                    ? 'border-blue-500'
                    : 'border-gray-300'
                }`}
                loading="lazy"
                alt={`Thumbnail ${idx + 1}`}
              />
            ))}
          </div>
          <div className="flex-1 relative group">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full max-h-[500px] object-contain rounded-lg shadow-lg transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <button
              onClick={openImageView}
              className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow hover:bg-gray-100"
              aria-label="Phóng to ảnh"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3 text-gray-800">
          <h1 className="text-3xl font-bold">{selectedVariation?.name}</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-red-600 text-2xl font-bold">
              {formatPrice(details.displayPrice)}
            </span>
            {details.salePrice !== 0 && (
              <span className="line-through text-gray-500">
                {formatPrice(details.originalPrice)}
              </span>
            )}
            {details.discountPercentage && (
              <span className="bg-red-100 text-red-600 text-sm font-medium px-2 py-1 rounded">
                -{details.discountPercentage}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Số lượng tồn kho:</h4>
            <p className="text-sm text-gray-600">
              {details.stockQuantity ? `${details.stockQuantity}` : 'Hết hàng'}
            </p>
          </div>
          {variations.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="font-semibold mb-2">Biến thể:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-2 max-w-[300px]">
                {variations.map((variation) => (
                  <button
                    key={variation._id}
                    onClick={() => handleVariationSelect(variation)}
                    className={`px-4 py-2 rounded border transition-all text-sm font-semibold ${
                      selectedVariation?._id === variation._id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {variation.colorName}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Mã SKU:</strong> {selectedVariation?.sku || ''}
            </p>
            <p>
              <strong>Kích thước:</strong> {selectedVariation?.dimensions || ''}
            </p>
            <p>
              <strong>Chất liệu:</strong>{' '}
              {selectedVariation?.material &&
              typeof selectedVariation.material === 'object' &&
              'name' in selectedVariation.material
                ? selectedVariation.material.name
                : 'Không xác định'}
            </p>
            <p>
              <strong>Mau sắc:</strong>{' '}
              {selectedVariation?.colorName || 'Không xác định'}{' '}
            </p>
            {/* GIỮ PHẦN MÔ TẢ NGẮN Ở ĐÂY */}
            {product.descriptionShort && (
              <p>
                <strong>Mô tả ngắn:</strong>{' '}
                <span
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: product.descriptionShort }}
                ></span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex border rounded overflow-hidden">
              <button
                onClick={decreaseQty}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100"
                disabled={isUpdating}
                aria-label="Giảm số lượng"
              >
                −
              </button>
              <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-12 text-center py-2 border-x border-gray-300"
                aria-label="Số lượng"
                disabled={isUpdating}
              />
              <button
                onClick={increaseQty}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100"
                disabled={isUpdating}
                aria-label="Tăng số lượng"
              >
                +
              </button>
            </div>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded transition-all disabled:bg-gray-400"
              disabled={
                isUpdating || details.stockQuantity === 0 || !selectedVariation
              }
              onClick={() => {
                if (!selectedVariation) {
                  toast.error('Vui lòng chọn biến thể sản phẩm!', {
                    autoClose: 1000,
                  });
                  return;
                }
                const parsedQty = parseInt(quantity, 10);
                if (isNaN(parsedQty) || parsedQty < 1) {
                  toast.error('Số lượng phải là số nguyên lớn hơn 0!', {
                    autoClose: 1000,
                  });
                  setQuantity('1');
                  return;
                }
                setIsUpdating(true);
                addToCartMutation.mutate({
                  variationId: selectedVariation._id,
                  quantity: parsedQty,
                });
              }}
            >
              Thêm vào giỏ
            </button>
            <button
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2 rounded transition-all disabled:bg-gray-400"
              disabled={
                isUpdating || details.stockQuantity === 0 || !selectedVariation
              }
              onClick={handleBuyNow}
            >
              Mua ngay
            </button>
          </div>
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Tình trạng:</h4>
            <p
              className={`text-sm font-semibold pt-1 ${
                (details.stockQuantity || 0) > 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {typeof details.stockQuantity === 'number' &&
              details.stockQuantity > 0
                ? 'Còn hàng'
                : 'Hết hàng'}
            </p>
          </div>
        </div>
      </div>
      {isImageViewOpen && allImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300"
          role="dialog"
          aria-labelledby="modal-title"
          aria-modal="true"
        >
          <button
            onClick={closeImageView}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
            aria-label="Đóng góp"
          >
            ×
          </button>
          <div className="relative w-[90%] max-h-[80vh] overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
            >
              {allImages.map((src, idx) => (
                <img
                  key={idx}
                  src={getImageUrl(src)}
                  alt={`${product.name} - Image ${idx + 1}`}
                  className="w-full max-h-[80vh] object-contain flex-shrink-0"
                />
              ))}
            </div>
          </div>
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:bg-gray-800 hover:bg-opacity-50 rounded-full p-2 disabled:opacity-50"
            disabled={currentImageIndex === 0}
            aria-label="Ảnh trước"
          >
            <MdNavigateNext className="transform rotate-180" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:bg-gray-800 hover:bg-opacity-50 rounded-full p-2 disabled:opacity-50"
            disabled={currentImageIndex === allImages.length - 1}
            aria-label="Ảnh tiếp theo"
          >
            <MdNavigateNext />
          </button>
          <p className="absolute bottom-4 text-white font-medium">
            {currentImageIndex + 1} / {allImages.length}
          </p>
        </div>
      )}

      {/* --- Phần Mô Tả Chi Tiết Sản Phẩm (MỚI) --- */}
      {product.descriptionLong && (
        <div className="mt-12 border-t pt-8 w-full">
          <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Mô tả chi tiết sản phẩm
          </h3>
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 w-full text-gray-700">
            <span
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: product.descriptionLong }}
            ></span>
          </div>
        </div>
      )}
      {!product.descriptionShort &&
        !product.descriptionLong && ( // Thêm điều kiện này nếu cả 2 mô tả đều không có
          <div className="mt-12 border-t pt-8 w-full">
            <p className="text-center text-lg text-gray-500 italic py-8 bg-white rounded-xl shadow-sm border border-gray-100 w-full">
              Sản phẩm này chưa có mô tả chi tiết.
            </p>
          </div>
        )}

      {/* --- Phần Đánh Giá Sản Phẩm (Form) --- */}
      <div className="mt-12 border-t pt-8 w-full">
        <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Đánh giá sản phẩm
        </h3>
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 space-y-6 w-full">
          <p className="text-lg font-semibold text-gray-700">
            Chia sẻ cảm nhận của bạn về sản phẩm này!
          </p>
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">
              Chọn số sao:
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-4xl transition-all duration-200 ${
                    rating >= star ? 'text-yellow-500' : 'text-gray-300'
                  } hover:scale-110`}
                  aria-label={`Chọn ${star} sao`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label
              htmlFor="comment"
              className="block text-base font-medium text-gray-700 mb-2"
            >
              Nhận xét của bạn:
            </label>
            <div className="relative">
              <textarea
                id="comment"
                rows={5}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Sản phẩm này tuyệt vời! Tôi rất thích..."
                className="w-full border border-gray-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-500 resize-none transition-shadow duration-200"
              />
              <span className="absolute bottom-2 right-3 text-sm text-gray-500">
                {comment.length}/{MAX_COMMENT_LENGTH} ký tự
              </span>
            </div>
          </div>
          <button
            onClick={handleSubmitReview}
            disabled={
              isSubmittingReview ||
              rating === 0 ||
              comment.trim() === '' ||
              comment.length > MAX_COMMENT_LENGTH
            }
            className={`w-full font-bold py-3 px-6 rounded-lg transition-all duration-300 transform ${
              rating === 0 ||
              comment.trim() === '' ||
              comment.length > MAX_COMMENT_LENGTH ||
              isSubmittingReview
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
            }`}
          >
            {isSubmittingReview ? 'Đang gửi đánh giá...' : 'Gửi đánh giá'}
          </button>
        </div>

        {/* --- Phần Danh sách đánh giá --- */}
        <div className="mt-12 w-full">
          <h4 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Tất cả đánh giá ({reviews.length})
          </h4>
          {reviews.length > 0 ? (
            <div className="space-y-6 w-full">
              {reviews.map((review) => (
                <div
                  key={review._id}
                  className="bg-white rounded-xl shadow-md border border-gray-100 p-6 flex flex-col space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FaUserCircle className="text-gray-500 text-3xl" />{' '}
                      {/* Icon người dùng */}
                      <span className="font-semibold text-lg text-gray-900">
                        {review.user?.name || 'Người dùng ẩn danh'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {' '}
                      {/* Giảm khoảng cách giữa các sao */}
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-xl ${
                            star <= review.rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    "{review.comment}"
                  </p>

                  <div className="text-sm text-gray-500 mt-2 text-right">
                    Đánh giá vào:{' '}
                    {new Date(review.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>

                  {/* Phần hiển thị phản hồi của Admin */}
                  {review.replies && review.replies.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      {review.replies.map((reply) => (
                        <div
                          key={reply._id}
                          className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm flex items-start space-x-3"
                        >
                          <FaBuilding className="text-blue-600 text-2xl mt-1" />{' '}
                          {/* Icon admin/công ty */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="font-bold text-blue-800">
                                Phản hồi từ Quản trị viên (
                                {reply.admin?.name || 'Cửa hàng'})
                              </span>
                              <span className="text-gray-600">
                                {new Date(reply.createdAt).toLocaleDateString(
                                  'vi-VN'
                                )}
                              </span>
                            </div>
                            <p className="text-gray-800 italic leading-snug">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Kết thúc phần hiển thị phản hồi của Admin */}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-lg text-gray-500 italic py-8 bg-white rounded-xl shadow-sm border border-gray-100 w-full">
              Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên để
              lại nhận xét!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
