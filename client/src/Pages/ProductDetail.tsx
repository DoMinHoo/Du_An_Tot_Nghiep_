import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchProduct, fetchVariations } from '../services/apiService';
import {
  formatPrice,
  calculateDiscount,
  isValidPrice,
} from '../utils/priceUtils';
import { API_BASE_URL } from '../constants/api';
import { getImageUrl } from '../utils/imageUtils';
import type { Product } from '../types/Product';
import type { Variation } from '../types/Variations';
import axios from 'axios';

// Hàm lấy thông tin giá và số lượng
const getPriceAndStockDetails = (
  product: Product | undefined,
  selectedVariation: Variation | null
) => {
  const salePrice = selectedVariation?.salePrice;
  const originalPrice = selectedVariation?.finalPrice;
  const displayPrice = salePrice ?? originalPrice;
  const stockQuantity = selectedVariation
    ? selectedVariation.stockQuantity
    : product?.stock_quantity ?? 0;

  return { salePrice, originalPrice, displayPrice, stockQuantity };
};

// Hàm lấy thông tin giá hiển thị cho biến thể
const getVariationPriceDetails = (variation: Variation) => {
  const salePrice = variation.salePrice;
  const originalPrice = variation.finalPrice;
  const displayPrice = salePrice ?? originalPrice;
  return { salePrice, originalPrice, displayPrice };
};

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(
    null
  );
  const [mainImage, setMainImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isImageViewOpen, setIsImageViewOpen] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // Kiểm tra ID hợp lệ ngay từ đầu
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

  const getNumberValue = (value: any): number | null => {
    return typeof value === 'number' ? value : null;
  };

  const effectiveFinalPrice =
    selectedVariation && isValidPrice(selectedVariation.finalPrice)
      ? getNumberValue(selectedVariation.finalPrice)
      : null;

  // Fetch product and variations using react-query
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

  // Danh sách hình ảnh kết hợp (sản phẩm + biến thể)
  const allImages = useMemo(() => {
    const productImages =
      product?.image && Array.isArray(product.image) ? product.image : [];
    const variationImage = selectedVariation?.colorImageUrl;
    return variationImage ? [variationImage, ...productImages] : productImages;
  }, [product, selectedVariation]);

  // Tính toán giá và số lượng sử dụng useMemo để tối ưu hiệu suất
  const details = useMemo(
    () => getPriceAndStockDetails(product, selectedVariation),
    [product, selectedVariation]
  );

  // Set initial variation and main image
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

  const handleVariationSelect = (variation: Variation) => {
    setSelectedVariation(variation);
    setMainImage(
      variation.colorImageUrl
        ? getImageUrl(variation.colorImageUrl)
        : product?.image?.[0]
        ? getImageUrl(product.image[0])
        : getImageUrl()
    );
    setQuantity(1); // Reset quantity when changing variation
  };

  const increaseQty = () => {
    if (quantity < details.stockQuantity) {
      setQuantity((q) => q + 1);
    } else {
      toast.warn('Đã đạt số lượng tối đa trong kho!');
    }
  };

  const decreaseQty = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  const addToCart = async () => {
    try {
      if (variations.length > 0 && !selectedVariation) {
        toast.error('Vui lòng chọn một biến thể sản phẩm');
        return;
      }
      if (details.stockQuantity === 0) {
        toast.error('Sản phẩm hiện đã hết hàng');
        return;
      }
      const cartItem = {
        productId: id,
        variationId: selectedVariation?._id,
        quantity,
      };
      await axios.post(`${API_BASE_URL}/cart/add`, cartItem);
      toast.success('Đã thêm vào giỏ hàng!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng.');
    }
  };

  const buyNow = async () => {
    try {
      if (variations.length > 0 && !selectedVariation) {
        toast.error('Vui lòng chọn một biến thể sản phẩm');
        return;
      }
      if (details.stockQuantity === 0) {
        toast.error('Sản phẩm hiện đã hết hàng');
        return;
      }
      const orderItem = {
        productId: id,
        variationId: selectedVariation?._id,
        quantity,
      };
      await axios.post(`${API_BASE_URL}/order/create`, orderItem);
      toast.success('Đã tạo đơn hàng!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi tạo đơn hàng.');
    }
  };

  const openImageView = () => setIsImageViewOpen(true);
  const closeImageView = () => {
    setIsImageViewOpen(false);
    setCurrentImageIndex(0);
  };
  const nextImage = () => {
    if (allImages && currentImageIndex < allImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };
  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

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
        <div className="flex flex-col gap-6 text-gray-800">
          <h2 className="text-2xl md:text-3xl font-semibold">{product.name}</h2>

          {/* Hiển thị giá */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-red-600 text-2xl font-bold">
              {formatPrice(details.displayPrice)}
            </span>
            {isValidPrice(details.salePrice) &&
              isValidPrice(details.originalPrice) &&
              details.salePrice !== undefined &&
              details.originalPrice !== undefined &&
              details.salePrice < details.originalPrice && (
                <>
                  <span className="line-through text-gray-500">
                    {formatPrice(details.originalPrice)}
                  </span>
                </>
              )}
          </div>

          {/* Hiển thị số lượng tồn kho */}
          <div>
            <h4 className="font-semibold mb-2">Số lượng tồn kho:</h4>
            <p className="text-sm text-gray-700">
              {details.stockQuantity > 0
                ? `${details.stockQuantity} sản phẩm`
                : 'Hết hàng'}
            </p>
          </div>

          {variations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Biến thể:</h4>
              <div className="flex flex-wrap gap-2">
                {variations.map((variation) => {
                  const variationPrice = getVariationPriceDetails(variation);
                  return (
                    <button
                      key={variation._id}
                      onClick={() => handleVariationSelect(variation)}
                      className={`px-4 py-2 rounded border transition-all text-sm font-semibold ${
                        selectedVariation?._id === variation._id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {variation.name} ({variation.colorName})
                    </button>
                  );
                })}
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
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                readOnly
                className="w-12 text-center border-x border-gray-300"
              />
              <button
                onClick={increaseQty}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300"
                disabled={quantity >= details.stockQuantity}
              >
                +
              </button>
            </div>

            <button
              onClick={addToCart}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded transition disabled:bg-gray-400"
              disabled={details.stockQuantity === 0}
            >
              Thêm vào giỏ
            </button>

            <button
              onClick={buyNow}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 rounded transition disabled:bg-gray-400"
              disabled={details.stockQuantity === 0}
            >
              Mua ngay
            </button>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Tình trạng:</h4>
            <p
              className={`text-sm font-semibold ${
                details.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {details.stockQuantity > 0 ? 'Còn hàng' : 'Hết hàng'}
            </p>
          </div>
        </div>
      </div>

      {/* Image View Modal */}
      {isImageViewOpen && allImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <button
            onClick={closeImageView}
            className="absolute top-4 right-4 text-white text-2xl"
          >
            ×
          </button>
          <button
            onClick={prevImage}
            className="absolute left-4 text-white text-4xl disabled:opacity-50"
            disabled={currentImageIndex === 0}
          ></button>
          <img
            src={getImageUrl(allImages[currentImageIndex])}
            alt={`${product.name} - Image ${currentImageIndex + 1}`}
            className="max-h-[80vh] max-w-[90vw] object-contain"
          />
          <button
            onClick={nextImage}
            className="absolute right-4 text-white text-4xl disabled:opacity-50"
            disabled={currentImageIndex === allImages.length - 1}
          ></button>
          <p className="absolute bottom-4 text-white">
            {currentImageIndex + 1} / {allImages.length}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
