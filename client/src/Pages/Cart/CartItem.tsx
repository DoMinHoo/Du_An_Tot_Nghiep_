    import React from 'react';
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
    const name = item.variationId?.name || 'Sản phẩm không xác định';
    const dimensions = item.variationId?.dimensions || 'N/A';
    const materialVariation = item.variationId?.materialVariation || 'N/A';
    const salePrice = item.variationId?.salePrice;
    const finalPrice = item.variationId?.finalPrice || 0;
    const displayPrice =
        salePrice && salePrice < finalPrice ? salePrice : finalPrice;
    const stockQuantity = item.variationId?.stockQuantity || 0;
    const imageUrl = item.variationId?.colorImageUrl
        ? getImageUrl(item.variationId.colorImageUrl)
        : getImageUrl();

    const handleIncrease = () => {
        if (item.quantity >= stockQuantity) {
        toast.warn(`Số lượng tối đa trong kho là ${stockQuantity}!`);
        return;
        }
        onUpdateQuantity(item.quantity + 1);
    };

    const handleDecrease = () => {
        if (item.quantity <= 1) {
        toast.warn('Số lượng tối thiểu là 1!');
        return;
        }
        onUpdateQuantity(item.quantity - 1);
    };

    return (
        <div className="flex items-start gap-4 bg-white rounded-xl shadow p-4">
        <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="mt-2 accent-black w-5 h-5"
        />
        <img
            src={imageUrl}
            alt={name}
            className="w-28 h-28 object-cover rounded-lg"
            onError={(e) => {
            e.currentTarget.src = getImageUrl();
            }}
        />
        <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{name}</h3>
            <p className="text-sm text-gray-600">Kích thước: {dimensions}</p>
            <p className="text-sm text-gray-600">Chất liệu: {materialVariation}</p>
            <div className="text-red-600 font-semibold mt-1">
            {formatPrice(displayPrice)}
            </div>
            {salePrice && salePrice < finalPrice && (
            <div className="line-through text-sm text-gray-400">
                {formatPrice(finalPrice)}
            </div>
            )}
            <div className="flex items-center mt-3 w-max border rounded overflow-hidden">
            <button
                onClick={handleDecrease}
                className="px-3 py-1 text-lg bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300"
                disabled={item.quantity <= 1}
            >
                −
            </button>
            <input
                type="text"
                readOnly
                value={item.quantity}
                className="w-12 text-center border-x outline-none text-base py-1"
            />
            <button
                onClick={handleIncrease}
                className="px-3 py-1 text-lg bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300"
                disabled={item.quantity >= stockQuantity}
            >
                +
            </button>
            </div>
        </div>
        <div className="text-right">
            <button
            onClick={onRemove}
            className="text-xl text-gray-500 hover:text-black"
            >
            ×
            </button>
            <div className="font-bold mt-4">
            {formatPrice(displayPrice * item.quantity)}
            </div>
        </div>
        </div>
    );
    };

    export default CartItemComponent;
