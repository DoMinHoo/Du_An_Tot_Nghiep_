import React from 'react';

const formatPrice = (price) =>
    price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const ProductCard = ({ product }) => {
    if (!product) return null;

    const now = new Date();
    const inFlashSale =
        product.flashSale_discountedPrice &&
        new Date(product.flashSale_start) <= now &&
        new Date(product.flashSale_end) >= now;

    const displayPrice = inFlashSale
        ? product.flashSale_discountedPrice
        : product.salePrice || product.price;

    const originalPrice =
        inFlashSale || product.salePrice ? formatPrice(product.price) : null;

    return (
        <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
            <img
                src={product.images?.[0]}
                alt={product.name}
                className="w-full h-48 object-cover"
            />
            <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">
                    {product.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2">{product.descriptionShort}</p>

                <div className="mt-2">
                    <span className="text-red-500 font-bold text-base">
                        {formatPrice(displayPrice)}
                    </span>
                    {originalPrice && (
                        <span className="text-sm text-gray-400 line-through ml-2">
                            {originalPrice}
                        </span>
                    )}
                </div>

                <div className="text-xs text-gray-500 mt-1">
                    Đã bán: {product.totalPurchased || 0}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
