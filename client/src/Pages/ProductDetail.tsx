import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchProduct, fetchVariations } from '../services/apiService';
import { formatPrice, isValidPrice } from '../utils/priceUtils';
import { getImageUrl } from '../utils/imageUtils';
import type { Product } from '../types/Product';
import type { Variation } from '../types/Variations';
import { MdNavigateNext } from 'react-icons/md';

// Hàm lấy thông tin giá, số lượng và phần trăm giảm giá
const getPriceAndStockDetails = (
  product: Product | undefined,
  selectedVariation: Variation | null
) => {
  const salePrice = selectedVariation?.salePrice;
  const originalPrice = selectedVariation?.finalPrice;
  const displayPrice = salePrice ?? originalPrice;
  const stockQuantity = selectedVariation?.stockQuantity;

  // Tính phần trăm giảm giá
  let discountPercentage: number | null = null;
  if (
    isValidPrice(salePrice) &&
    isValidPrice(originalPrice) &&
    salePrice !== undefined &&
    originalPrice !== undefined &&
    salePrice !== null &&
    originalPrice !== null &&
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
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(
    null
  );
  const [mainImage, setMainImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isImageViewOpen, setIsImageViewOpen] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [, setSlideDirection] = useState<'left' | 'right' | null>(null);

  // Kiểm tra ID sản phẩm hợp lệ
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-10 text-center text-red-600">
        ID sản phẩm không hợp lệ
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // Lấy dữ liệu sản phẩm và biến thể
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [productQuery, variationsQuery] = useQueries({
    queries: [
      {
        queryKey: ['product', id],
        queryFn: () => fetchProduct(id),
        retry: 2,
        onError: (err: any) => {
          toast.error(err.message || 'Không thể tải thông tin sản phẩm');
        },
      },
      {
        queryKey: ['variations', id],
        queryFn: () => fetchVariations(id),
        retry: 2,
        onError: (err: any) => {
          toast.info(
            'Sản phẩm này không có biến thể hoặc lỗi khi tải biến thể'
          );
        },
      },
    ],
  });

  const product = productQuery.data;
  const variations = variationsQuery.data || [];
  const isLoading = productQuery.isLoading || variationsQuery.isLoading;
  const error = productQuery.error || variationsQuery.error;

  // Tạo danh sách hình ảnh từ sản phẩm và biến thể
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const allImages = useMemo(() => {
    const productImages =
      product?.image && Array.isArray(product.image) ? product.image : [];
    const variationImage = selectedVariation?.colorImageUrl;
    return variationImage ? [variationImage, ...productImages] : productImages;
  }, [product, selectedVariation]);

  // Tính toán giá, tồn kho và phần trăm giảm giá
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const details = useMemo(
    () => getPriceAndStockDetails(product, selectedVariation),
    [product, selectedVariation]
  );

  // Khởi tạo biến thể và hình ảnh chính
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    if (variations.length > 0 && !selectedVariation) {
      setSelectedVariation(variations[0]);
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
      );
    }
    if (variations.length === 0 && !variationsQuery.isLoading) {
      toast.info('Sản phẩm này không có biến thể.');
    }
  }, [variations, product, selectedVariation, variationsQuery.isLoading]);

  // Chọn biến thể và cập nhật hình ảnh
  const handleVariationSelect = (variation: Variation) => {
    setSelectedVariation(variation);
    setMainImage(
      variation.colorImageUrl
        ? getImageUrl(variation.colorImageUrl)
        : product?.image?.[0]
        ? getImageUrl(product.image[0])
        : getImageUrl()
    );
    setQuantity(1); // Reset số lượng
  };

  // Tăng số lượng sản phẩm
  const increaseQty = () => {
    if (quantity < (details.stockQuantity || 0)) {
      setQuantity((q) => q + 1);
    } else {
      toast.warn('Đã đạt số lượng tối đa trong kho!');
    }
  };

  // Giảm số lượng sản phẩm
  const decreaseQty = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  // Kiểm tra trạng thái đăng nhập
  const checkAuth = (): boolean => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Vui lòng đăng nhập để thực hiện thao tác này');
      navigate('/login');
      return false;
    }
    return true;
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

  // Xử lý điều hướng bằng bàn phím
  // eslint-disable-next-line react-hooks/rules-of-hooks
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
  }, [isImageViewOpen, currentImageIndex, allImages]);

  if (isLoading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="animate-pulse">
            <div className="h-[500px] bg-gray-300 rounded-lg"></div>
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
        {errorMessage}
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      <ToastContainer />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Hình ảnh + thumbnail */}
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
              className="w-full max-h-[500px] object-contain rounded-lg shadow transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <button
              onClick={openImageView}
              className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow hover:bg-gray-100"
              title="Phóng to ảnh"
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

        {/* Thông tin chi tiết */}
        <div className="flex flex-col gap-3 text-gray-800">
          <h2 className="text-2xl md:text-3xl font-semibold">{product.name}</h2>

          {/* Hiển thị giá và phần trăm giảm giá */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-red-600 text-2xl font-bold">
              {formatPrice(details.displayPrice ?? null)}
            </span>
            {isValidPrice(details.salePrice) &&
              isValidPrice(details.originalPrice) &&
              details.salePrice !== undefined &&
              details.originalPrice !== undefined &&
              details.salePrice !== null &&
              details.originalPrice !== null &&
              details.salePrice < details.originalPrice && (
                <>
                  <span className="line-through text-gray-500">
                    {formatPrice(details.originalPrice)}
                  </span>
                  <span className="bg-red-100 text-red-600 text-sm font-semibold px-2 py-1 rounded">
                    -{details.discountPercentage}%
                  </span>
                </>
              )}
          </div>

          {/* Hiển thị số lượng tồn kho */}
          <div className="flex flex-row items-center gap-2">
            <h4 className="font-semibold mb-2">Số lượng tồn kho:</h4>
            <p className="text-sm text-gray-700 pb-[6px]">
              {(details.stockQuantity ?? 0) > 0
                ? `${details.stockQuantity ?? 0} `
                : 'Hết hàng'}
            </p>
          </div>

          {variations.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="font-semibold mb-2">Biến thể:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-2 w-[300px]">
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
                    {variation.dimensions}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Mã Skuku:</strong>{' '}
              {selectedVariation?.sku || 'Không xác định'}
            </p>
            <p>
              <strong>Kích thước:</strong>{' '}
              {selectedVariation?.dimensions || 'Không xác định'}
            </p>
            <p>
              <strong>Chất liệu:</strong>{' '}
              {selectedVariation?.materialVariation ||
                product.material ||
                'Không xác định'}
            </p>
            <p>
              <strong>Mô tả ngắn:</strong>{' '}
              {product.descriptionShort || 'Không có mô tả'}
            </p>
            <p>
              <strong>Mô tả chi tiết:</strong>{' '}
              {product.descriptionLong || 'Không có mô tả'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex border rounded overflow-hidden">
              <button
                onClick={decreaseQty}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300"
                disabled={quantity <= 1}
                aria-label="Giảm số lượng"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                readOnly
                className="w-12 pl-3.5 text-center border-x border-gray-300"
                aria-label="Số lượng"
              />
              <button
                onClick={increaseQty}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300"
                disabled={quantity >= (details.stockQuantity || 0)}
                aria-label="Tăng số lượng"
              >
                +
              </button>
            </div>

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded transition disabled:bg-gray-400"
              disabled={(details.stockQuantity || 0) === 0}
              onClick={checkAuth}
            >
              Thêm vào giỏ
            </button>

            <button
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 rounded transition disabled:bg-gray-400"
              disabled={(details.stockQuantity || 0) === 0}
              onClick={checkAuth}
            >
              Mua ngay
            </button>
          </div>

          <div className="flex flex-row items-center gap-2">
            <h4 className="font-semibold">Tình trạng:</h4>
            <p
              className={`text-sm font-semibold pt-1 ${
                (details.stockQuantity || 0) > 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {(details.stockQuantity || 0) > 0 ? 'Còn hàng' : 'Hết hàng'}
            </p>
          </div>
        </div>
      </div>

      {/* Image View Modal */}
      {isImageViewOpen && allImages.length > 0 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300"
          role="dialog"
          aria-labelledby="image-modal-title"
          aria-modal="true"
        >
          <button
            onClick={closeImageView}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded-full"
            aria-label="Đóng phóng to ảnh"
          >
            ×
          </button>
          <div className="relative w-[90%] max-h-[80vh] overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${currentImageIndex * 100}%)`,
              }}
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
            className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 text-white text-4xl md:text-5xl hover:bg-gray-800 hover:bg-opacity-50 rounded-full p-2 transition-all focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
            disabled={currentImageIndex === 0}
            aria-label="Ảnh trước"
          >
            <MdNavigateNext className="transform rotate-180" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 text-white text-4xl md:text-5xl hover:bg-gray-800 hover:bg-opacity-50 rounded-full p-2 transition-all focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-50"
            disabled={currentImageIndex === allImages.length - 1}
            aria-label="Ảnh tiếp theo"
          >
            <MdNavigateNext />
          </button>
          <p className="absolute bottom-4 text-white text-lg font-semibold">
            {currentImageIndex + 1} / {allImages.length}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
