    // src/components/Cart/CartSummary.tsx
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
        <div className="bg-white rounded-xl shadow p-6 sticky top-8">
        <h3 className="text-lg font-semibold border-b pb-2 mb-4">
            Thông tin đơn hàng
        </h3>
        <div className="flex justify-between text-lg font-bold text-red-600 mb-4">
            <span>Tổng tiền:</span>
            <span>{formatPrice(totalPrice)}</span>
        </div>
        <button
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
            disabled={selectedCount === 0}
            onClick={onCheckout}
        >
            THANH TOÁN
        </button>
        <button
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-lg mt-4"
            onClick={onClearCart}
        >
            XÓA GIỎ HÀNG
        </button>
        <div className="text-sm text-gray-600 mt-6 space-y-3">
            <div>
            <span className="inline-block text-lg mr-2">🛡️</span>
            Không rủi ro. Đặt hàng trước, thanh toán sau tại nhà.
            </div>
            <div>
            <span className="inline-block text-lg mr-2">⏱️</span>
            Giao hàng trong vòng 3 ngày sau xác nhận.
            </div>
            <div>
            <span className="inline-block text-lg mr-2">🏆</span>
            Chất lượng Quốc Tế đảm bảo tiêu chuẩn.
            </div>
        </div>
        </div>
    );
    };

    export default CartSummary;