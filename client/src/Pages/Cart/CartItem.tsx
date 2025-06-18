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
    const displayPrice = salePrice || finalPrice;
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
            <h3 className="font-medium text-gray-800 text-sm">{name}</h3> {/* font-semibold → font-medium, thêm text-sm */}
            <p className="text-xs text-gray-500">Kích thước: {dimensions}</p> 
            <p className="text-xs text-gray-500">Chất liệu: {materialVariation}</p>
            <div className="text-red-500 font-medium text-sm mt-1"> {/* text-red-600 → text-red-500, font-semibold → font-medium */}
            {formatPrice(displayPrice)}
            </div>
            {salePrice && salePrice < finalPrice && (
            <div className="line-through text-xs text-gray-400"> {/* text-sm → text-xs */}
                {formatPrice(finalPrice)}
            </div>
            )}
            <div className="flex items-center mt-2 w-max border rounded-md overflow-hidden">
            <button
                onClick={handleDecrease}
                className="px-2 py-1 text-base bg-gray-50 hover:bg-gray-100 disabled:bg-gray-200 transition-colors" 
                disabled={item.quantity <= 1}
            >
                −
            </button>
            <input
                type="text"
                readOnly
                value={item.quantity}
                className="w-10 text-center border-x outline-none text-sm py-1" 
            />
            <button
                onClick={handleIncrease}
                className="px-2 py-1 text-base bg-gray-50 hover:bg-gray-100 disabled:bg-gray-200 transition-colors"
                disabled={item.quantity >= stockQuantity}
            >
                +
            </button>
            </div>
        </div>
        <div className="text-right space-y-2"> {/* Thêm space-y-2 */}
            <button
            onClick={onRemove}
            className="text-lg text-gray-400 hover:text-red-500 transition-colors" 
            >
            ×
            </button>
            <div className="font-medium text-sm"> {/* font-bold → font-medium, thêm text-sm */}
            {formatPrice(displayPrice * item.quantity)}
            </div>
        </div>
        </div>
    );
    };

    export default CartItemComponent;