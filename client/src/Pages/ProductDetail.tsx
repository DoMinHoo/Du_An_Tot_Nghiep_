import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { Product } from '../types/Product';
import type { ProductVariation } from '../types/Variations';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [selectedVariation, setSelectedVariation] =
    useState<ProductVariation | null>(null);
  const [mainImage, setMainImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isImageViewOpen, setIsImageViewOpen] = useState<boolean>(false); // New state for image view
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0); // Track current image

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:5000/api/products/${id}`
      );
      const productData: Product = response.data.data;
      const startDate = productData.flashSale_start
        ? new Date(productData.flashSale_start)
        : null;
      const endDate = productData.flashSale_end
        ? new Date(productData.flashSale_end)
        : null;
      setProduct({
        ...productData,
        flashSale_start: startDate,
        flashSale_end: endDate,
      });
      setMainImage(productData.image[0] || '');
      setLoading(false);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Không thể tải thông tin sản phẩm.';
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const fetchVariations = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/variations/${id}`
      );
      if (!Array.isArray(response.data))
        throw new Error('Dữ liệu biến thể không đúng định dạng');
      const variationsData: ProductVariation[] = response.data;
      setVariations(variationsData);
      if (variationsData.length > 0) {
        setSelectedVariation(variationsData[0]);
        setMainImage(
          variationsData[0].colorImageUrl || product?.image[0] || ''
        );
      } else {
        setSelectedVariation(null);
        toast.info('Sản phẩm này không có biến thể.');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Không thể tải biến thể sản phẩm.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      const errorMessage = 'ID sản phẩm không hợp lệ';
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
      return;
    }
    fetchProduct();
    fetchVariations();
  }, [id]);

  const handleVariationSelect = (variation: ProductVariation) => {
    setSelectedVariation(variation);
    setMainImage(variation.colorImageUrl || product?.image[0] || '');
  };

  const increaseQty = () => {
    if (selectedVariation && quantity < selectedVariation.stockQuantity) {
      setQuantity((q) => q + 1);
    } else if (
      !selectedVariation &&
      product &&
      quantity < product.stock_quantity
    ) {
      setQuantity((q) => q + 1);
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
      const cartItem = {
        productId: id,
        variationId: selectedVariation?._id,
        quantity,
      };
      await axios.post('http://localhost:5000/api/cart/add', cartItem);
      toast.success('Đã thêm vào giỏ hàng!');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng.';
      toast.error(errorMessage);
    }
  };

  const buyNow = async () => {
    try {
      if (variations.length > 0 && !selectedVariation) {
        toast.error('Vui lòng chọn một biến thể sản phẩm');
        return;
      }
      const orderItem = {
        productId: id,
        variationId: selectedVariation?._id,
        quantity,
      };
      await axios.post('http://localhost:5000/api/order/create', orderItem);
      toast.success('Đã tạo đơn hàng!');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Lỗi khi tạo đơn hàng.';
      toast.error(errorMessage);
    }
  };

  // Image view functions
  const openImageView = () => {
    setIsImageViewOpen(true);
  };

  const closeImageView = () => {
    setIsImageViewOpen(false);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (product?.image && currentImageIndex < product.image.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (product?.image && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (error)
    return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!product)
    return <div className="text-center py-10">Không tìm thấy sản phẩm</div>;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      <ToastContainer />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Hình ảnh + thumbnail */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Thumbnail dọc */}
          <div className="flex lg:flex-col gap-2 overflow-y-auto max-h-[500px]">
            {product.image.map((src, idx) => (
              <img
                key={idx}
                src={src}
                onClick={() => setMainImage(src)}
                className={`w-16 h-16 object-cover rounded cursor-pointer border-2 transition-all ${
                  mainImage === src ? 'border-blue-500' : 'border-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Ảnh chính */}
          <div className="flex-1 relative">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full object-contain max-w-[900px] mx-auto rounded-lg shadow transition-transform duration-300 hover:scale-105"
              id="product-zoom-image"
            />
            <div
              id="product-zoom-in"
              className="product-zoom icon-pr-fix absolute bottom-4 left-60  cursor-pointer"
              aria-label="Zoom in"
              title="Zoom in"
              onClick={openImageView}
            >
              <span className="zoom-in" aria-hidden="true">
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  x="0px"
                  y="0px"
                  viewBox="0 0 36 36"
                  style={{
                    enableBackground: 'new 0 0 36 36',
                    width: '30px',
                    height: '30px',
                  }}
                  xmlSpace="preserve"
                >
                  <polyline points="6,14 9,11 14,16 16,14 11,9 14,6 6,6 "></polyline>
                  <polyline points="22,6 25,9 20,14 22,16 27,11 30,14 30,6 "></polyline>
                  <polyline points="30,22 27,25 22,20 20,22 25,27 22,30 30,30 "></polyline>
                  <polyline points="14,30 11,27 16,22 14,20 9,25 6,22 6,30 "></polyline>
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Thông tin chi tiết */}
        <div className="flex flex-col gap-6 text-gray-800">
          <h2 className="text-2xl md:text-3xl font-semibold">{product.name}</h2>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-red-600 text-2xl font-bold">
              {selectedVariation
                ? selectedVariation.salePrice
                  ? `${selectedVariation.salePrice.toLocaleString('vi-VN')}₫`
                  : `${selectedVariation.price.toLocaleString('vi-VN')}₫`
                : product.salePrice
                ? `${product.salePrice.toLocaleString('vi-VN')}₫`
                : `${product.price.toLocaleString('vi-VN')}₫`}
            </span>
            {selectedVariation?.salePrice && (
              <>
                <span className="line-through text-gray-500">
                  {selectedVariation.price.toLocaleString('vi-VN')}₫
                </span>
                <span className="bg-red-500 text-white text-sm px-2 py-1 rounded">
                  {Math.round(
                    ((selectedVariation.price - selectedVariation.salePrice) /
                      selectedVariation.price) *
                      100
                  )}
                  %
                </span>
              </>
            )}
          </div>

          <p className="text-orange-600 font-semibold text-sm md:text-base">
            {product.flashSale_discountedPrice &&
            product.flashSale_start instanceof Date &&
            product.flashSale_end instanceof Date &&
            product.flashSale_start <= new Date() &&
            product.flashSale_end > new Date()
              ? `Khuyến mãi Flash Sale: Chỉ còn ${product.flashSale_discountedPrice.toLocaleString(
                  'vi-VN'
                )}₫ đến ${product.flashSale_end.toLocaleString('vi-VN')}`
              : 'Sản phẩm đang có giá tốt nhất!'}
          </p>

          {variations.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Biến thể:</h4>
              <div className="flex flex-wrap gap-2">
                {variations.map((variation) => (
                  <button
                    key={variation._id}
                    onClick={() => handleVariationSelect(variation)}
                    className={`px-4 py-2 rounded border transition-all text-sm ${
                      selectedVariation?._id === variation._id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {variation.name} ({variation.colorName})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Kích thước:</strong>{' '}
              {product.dimensions || 'Không xác định'}
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
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                readOnly
                className="w-12 pl-3.5 text-center border-x border-gray-300"
              />
              <button
                onClick={increaseQty}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200"
              >
                +
              </button>
            </div>

            <button
              onClick={addToCart}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded transition"
              disabled={
                product.stock_quantity === 0 ||
                (selectedVariation && selectedVariation.stockQuantity === 0)
              }
            >
              Thêm vào giỏ
            </button>

            <button
              onClick={buyNow}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-6 py-2 rounded transition"
              disabled={
                product.stock_quantity === 0 ||
                (selectedVariation && selectedVariation.stockQuantity === 0)
              }
            >
              Mua ngay
            </button>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Tình trạng:</h4>
            <p
              className={`text-sm font-semibold ${
                product.stock_quantity > 0 &&
                (!selectedVariation || selectedVariation.stockQuantity > 0)
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {product.stock_quantity > 0 &&
              (!selectedVariation || selectedVariation.stockQuantity > 0)
                ? 'Còn hàng'
                : 'Hết hàng'}
            </p>
          </div>
        </div>
      </div>

      {/* Image View Modal */}
      {isImageViewOpen && product?.image && (
        <div className="fixed inset-0 bg-[#fffeff] bg-opacity-75 flex items-center justify-center z-50">
          <button
            onClick={closeImageView}
            className="absolute top-4 right-4 text-black text-2xl"
          >
            &times;
          </button>
          <button
            onClick={prevImage}
            className="absolute left-4 text-black text-4xl"
          >
            &lt;
          </button>
          <img
            src={product.image[currentImageIndex]}
            alt={`${product.name} - Image ${currentImageIndex + 1}`}
            className="max-h-[80vh] max-w-[90vw] object-contain"
          />
          <button
            onClick={nextImage}
            className="absolute right-4 text-black text-4xl"
          >
            &gt;
          </button>
          <p className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-black">
            {currentImageIndex + 1} / {product.image.length}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
