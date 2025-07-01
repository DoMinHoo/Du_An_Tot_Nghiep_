import React from 'react';
import { formatPrice } from '../../utils/priceUtils';

interface CartSummaryProps {
  totalPrice: number;
  selectedCount: number;
  onCheckout: () => void;
  onClearCart: () => void;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  totalPrice,
  selectedCount,
  onCheckout,
  onClearCart,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
      <h3 className="text-base font-medium border-b pb-1 mb-3">
        Thông tin đơn hàng
      </h3>
      <div className="flex justify-between text-base font-medium text-red-500 mb-3">
        <span>Tổng tiền:</span>
        <span>{formatPrice(totalPrice)}</span>
      </div>
      <button
        className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-md disabled:opacity-50 transition-colors"
        disabled={selectedCount === 0}
        onClick={onCheckout}
      >
        THANH TOÁN
      </button>
      <button
        className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 rounded-md mt-2"
        onClick={onClearCart}
      >
        XÓA GIỎ HÀNG
      </button>
      <div className="text-xs text-gray-500 mt-4 space-y-2">
        <div className="flex items-start">
          <span className="inline-block text-base mr-1">🛡️</span>
          Không rủi ro. Đặt hàng trước, thanh toán sau tại nhà.
        </div>
        <div className="flex items-start">
          <span className="inline-block text-base mr-1">⏱️</span>
          Giao hàng trong vòng 3 ngày sau xác nhận.
        </div>
        <div className="flex items-start">
          <span className="inline-block text-base mr-1">🏆</span>
          Chất lượng Quốc Tế đảm bảo tiêu chuẩn.
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
