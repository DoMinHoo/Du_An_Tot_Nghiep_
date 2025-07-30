import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getImageUrl } from '../../utils/imageUtils';

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
        {/* Đã bỏ 2 nút Thêm vào giỏ và Thanh toán */}
      </div>
    </div>
  );
};

export default SaleProductCard;
