import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getImageUrl } from '../../utils/imageUtils';
import { addToCart } from '../../services/cartService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { v4 as uuidv4 } from 'uuid';

interface SaleProductCardProps {
  product: any;
}

const SaleProductCard: React.FC<SaleProductCardProps> = ({ product }) => {
  const productName = product.productId?.name || product.name || 'Unnamed Product';
  const productId = product.productId?._id || product._id;
  const imageUrl = getImageUrl(product.colorImageUrl);
  const displayPrice = product.salePrice || product.finalPrice;
  const originalPrice = product.finalPrice;
  const hasDiscount = product.salePrice && product.salePrice < product.finalPrice;
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const queryClient = useQueryClient();

  // Lấy token hoặc guestId từ sessionStorage
  const token = sessionStorage.getItem('token') || undefined;
  let guestId = sessionStorage.getItem('guestId') || undefined;
  if (!token && !guestId) {
    guestId = uuidv4();
    sessionStorage.setItem('guestId', guestId);
  }

  // Mutation để thêm sản phẩm vào giỏ hàng
  const addToCartMutation = useMutation({
    mutationFn: ({ variationId, quantity }: { variationId: string; quantity: number }) =>
      addToCart(variationId, quantity, token, guestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setShowSuccessToast(true);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Lỗi khi thêm vào giỏ hàng', { autoClose: 1000 });
    },
    onSettled: () => setIsUpdating(false),
  });
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (product.flashSaleStart && product.flashSaleEnd) {
      const end = new Date(product.flashSaleEnd);
      const updateTimer = () => {
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        if (diff <= 0) {
          setTimeLeft('Hết giờ');
          return;
        }
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [product.flashSaleStart, product.flashSaleEnd]);

  useEffect(() => {
    if (showSuccessToast) {
      toast.success('Thêm vào giỏ hàng thành công!', {
        autoClose: 1000,
        onClose: () => setShowSuccessToast(false),
      });
    }
  }, [showSuccessToast]);

  const handleAddToCart = async () => {
    setIsUpdating(true);
    addToCartMutation.mutate({ variationId: product._id, quantity: 1 });
  };

  const handleCheckout = async () => {
    setIsUpdating(true);
    try {
      await addToCartMutation.mutateAsync({ variationId: product._id, quantity: 1 });
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      // Chỉ truyền sản phẩm vừa chọn sang trang checkout
      const checkedItem = {
        variationId: {
          _id: product._id,
          salePrice: product.salePrice ?? 0,
          finalPrice: product.finalPrice ?? 0,
          colorImageUrl: product.colorImageUrl ? getImageUrl(product.colorImageUrl) : (product.image && product.image.length > 0 ? getImageUrl(product.image[0]) : getImageUrl()),
          name: product.productId?.name || productName,
          color: product.colorName || '',
          stockQuantity: product.stockQuantity ?? 1,
        },
        quantity: 1,
      };
      const selectedId = product._id;
      const totalPrice = (product.salePrice || product.finalPrice || 0) * 1;
      navigate('/checkout', {
        state: {
          selectedItems: [selectedId],
          cartItems: [checkedItem],
          totalPrice,
        },
      });
    } catch {
      toast.error('Thêm vào giỏ hàng thất bại!', { autoClose: 1000 });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative w-full max-w-[300px] bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Nhãn giảm giá */}
      {hasDiscount && (
        <span className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow">
          -{Math.round(((originalPrice - displayPrice) / originalPrice) * 100)}%
        </span>
      )}

      {/* Countdown sale chỉ hiển thị khi có thời gian sale */}
      {product.flashSaleStart && product.flashSaleEnd && (
        <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mr-1"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" /></svg>
          <span>Còn lại: {timeLeft}</span>
        </div>
      )}


      {/* Hình ảnh sản phẩm (click vào ra chi tiết) */}
      <div className="relative group">
        <Link to={`/products/${productId}`} title={productName} className="block">
          <img
            src={imageUrl}
            alt={productName}
            className="w-full h-[240px] object-cover"
            onError={e => (e.currentTarget.src = getImageUrl())}
          />
        </Link>
      </div>

      {/* Thông tin sản phẩm */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 truncate">
          <Link to={`/products/${productId}`} className="hover:text-blue-600 transition-colors" title={productName}>
            {productName}
          </Link>
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-red-600 font-bold text-lg">
            {displayPrice?.toLocaleString()}₫
          </span>
          {hasDiscount && (
            <del className="text-gray-400 text-sm">
              {originalPrice?.toLocaleString()}₫
            </del>
          )}
        </div>
        <ToastContainer />
        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-blue-700 text-center transition-colors disabled:bg-gray-400"
            onClick={handleAddToCart}
            disabled={isUpdating}
          >
            {isUpdating ? 'Đang thêm...' : 'Thêm vào giỏ'}
          </button>
          <button
            className="flex-1 bg-green-600 text-white text-sm font-medium py-2 px-4 rounded-md hover:bg-green-700 text-center transition-colors disabled:bg-gray-400"
            onClick={handleCheckout}
            disabled={isUpdating}
          >
            {isUpdating ? 'Đang xử lý...' : 'Thanh toán'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaleProductCard;
