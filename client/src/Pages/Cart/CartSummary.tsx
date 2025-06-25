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
      {' '}
      {/* rounded-xl → rounded-lg, shadow → shadow-sm, p-6 → p-4, top-8 → top-4 */}
      <h3 className="text-base font-medium border-b pb-1 mb-3">
        {' '}
        {/* text-lg → text-base, font-semibold → font-medium, pb-2 → pb-1, mb-4 → mb-3 */}
        Thông tin đơn hàng
      </h3>
      <div className="flex justify-between text-base font-medium text-red-500 mb-3">
        {' '}
        {/* text-lg → text-base, font-bold → font-medium, text-red-600 → text-red-500, mb-4 → mb-3 */}
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
        {' '}
        {/* text-sm → text-xs, text-gray-600 → text-gray-500, mt-6 → mt-4, space-y-3 → space-y-2 */}
        <div className="flex items-start">
          <span className="inline-block text-base mr-1">🛡️</span>{' '}
          {/* text-lg → text-base, mr-2 → mr-1 */}
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
