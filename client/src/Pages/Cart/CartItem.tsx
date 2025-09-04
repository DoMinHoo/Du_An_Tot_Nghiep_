import React, { useState, useEffect } from 'react';
import { formatPrice } from '../../utils/priceUtils';
import { getImageUrl } from '../../utils/imageUtils';
import type { CartItem } from '../../types/Cart';
import { toast } from 'react-toastify';

interface CartItemProps {
  item: CartItem;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

const CartItemComponent: React.FC<CartItemProps> = ({
  item,
  isSelected,
  onSelect,
  onUpdateQuantity,
  onRemove,
}) => {
  const productId =
    item.variationId?.productId?.name || 'Sản phẩm không xác định';
  const name = item.variationId?.name || 'Sản phẩm không xác định';
  const corlor = item.variationId?.colorName || 'N/A';
  const dimensions = item.variationId?.dimensions || 'N/A';
  const materialVariation =
    item.variationId?.material &&
    typeof item.variationId.material === 'object' &&
    'name' in item.variationId.material
      ? item.variationId.material.name
      : 'Không xác định';
  const salePrice = item.variationId?.salePrice ?? 0; // Mặc định 0 nếu undefined/null
  const finalPrice = item.variationId?.finalPrice ?? 0; // Mặc định 0 nếu undefined/null
  const displayPrice = salePrice !== 0 ? salePrice : finalPrice; // Dùng salePrice nếu khác 0, ngược lại dùng finalPrice
  const stockQuantity = item.variationId?.stockQuantity || 0;
  const imageUrl = item.variationId?.colorImageUrl
    ? getImageUrl(item.variationId.colorImageUrl)
    : getImageUrl();

  // State để quản lý giá trị input số lượng
  const [quantity, setQuantity] = useState<string>(item.quantity.toString());

  // Đồng bộ quantity với item.quantity khi props thay đổi
  useEffect(() => {
    setQuantity(item.quantity.toString());
  }, [item.quantity]);

  // Xử lý tăng số lượng
  const handleIncrease = () => {
    const currentQty = parseInt(quantity, 10);
    if (isNaN(currentQty)) {
      toast.warn('Số lượng không hợp lệ!', { autoClose: 1000 });
      setQuantity(item.quantity.toString());
      return;
    }
    if (currentQty >= stockQuantity) {
      toast.warn(`Số lượng tối đa trong kho là ${stockQuantity}!`, {
        autoClose: 1000,
      });
      return;
    }
    const newQty = currentQty + 1;
    setQuantity(newQty.toString());
    onUpdateQuantity(newQty);
  };

  // Xử lý giảm số lượng
  const handleDecrease = () => {
    const currentQty = parseInt(quantity, 10);
    if (isNaN(currentQty)) {
      toast.warn('Số lượng không hợp lệ!', { autoClose: 1000 });
      setQuantity(item.quantity.toString());
      return;
    }
    if (currentQty <= 1) {
      toast.warn('Số lượng tối thiểu là 1!', { autoClose: 1000 });
      return;
    }
    const newQty = currentQty - 1;
    setQuantity(newQty.toString());
    onUpdateQuantity(newQty);
  };

  // Xử lý thay đổi input số lượng
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Chỉ cho phép các ký tự số hoặc rỗng (để có thể xóa)
    if (/^\d*$/.test(value)) {
      setQuantity(value);
    }
  };

  // Xử lý khi input mất focus hoặc nhấn Enter
  const handleQuantitySubmit = () => {
    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty < 1) {
      toast.error('Số lượng phải là số nguyên lớn hơn 0!', { autoClose: 1000 });
      setQuantity(item.quantity.toString());
      return;
    }
    if (parsedQty > stockQuantity) {
      toast.warn(`Số lượng tối đa trong kho là ${stockQuantity}!`, {
        autoClose: 1000,
      });
      setQuantity(stockQuantity.toString());
      onUpdateQuantity(stockQuantity);
      return;
    }
    if (parsedQty !== item.quantity) {
      onUpdateQuantity(parsedQty);
    }
  };

  // Xử lý khi nhấn Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleQuantitySubmit();
    }
  };

  return (
    <div className="flex items-start gap-3 bg-white rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        className="mt-1 accent-red-500 w-4 h-4 cursor-pointer"
      />
      <img
        src={imageUrl}
        alt={name}
        className="w-20 h-20 object-cover rounded-md"
        onError={(e) => {
          e.currentTarget.src = getImageUrl();
        }}
      />
      <div className="flex-1 space-y-1">
        <div className="space-y-1">
          <h3 className="font-medium text-gray-800 text-sm">{productId}</h3>
          <p className="text-xs text-gray-500">Màu sắc: {corlor}</p>
          <p className="text-xs text-gray-500">Kích thước: {dimensions}</p>
          <p className="text-xs text-gray-500">
            Chất liệu: {materialVariation}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-red-500 font-medium text-sm">
              {formatPrice(displayPrice)}
            </span>
            {salePrice !== 0 && (
              <span className="line-through text-xs text-gray-400">
                {formatPrice(finalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="text-right space-y-2">
        <button
          onClick={onRemove}
          className="text-lg text-gray-400 hover:text-red-500 transition-colors"
        >
          ×
        </button>
        <div className="font-medium text-sm">
          {formatPrice(displayPrice * item.quantity)}
        </div>
        <div className="flex items-center mt-2 w-max border rounded-md overflow-hidden">
          <button
            onClick={handleDecrease}
            className="px-2 py-1 text-base bg-gray-50 hover:bg-gray-100 disabled:bg-gray-200 transition-colors"
            disabled={parseInt(quantity, 10) <= 1 || stockQuantity === 0}
          >
            −
          </button>
          <input
            type="text"
            value={quantity}
            onChange={handleQuantityChange}
            onBlur={handleQuantitySubmit}
            onKeyDown={handleKeyDown}
            className="w-10 text-center border-x outline-none text-sm py-1"
            aria-label="Số lượng"
          />
          <button
            onClick={handleIncrease}
            className="px-2 py-1 text-base bg-gray-50 hover:bg-gray-100 disabled:bg-gray-200 transition-colors"
            disabled={
              parseInt(quantity, 10) >= stockQuantity || stockQuantity === 0
            }
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartItemComponent;
