export const isValidPrice = (price: unknown): boolean => {
    if (price == null) return false;
    const num = Number(price);
    return !isNaN(num) && num >= 0;
};

export const formatPrice = (price: number | null, currency = 'vi-VN'): string => {
    if (price == null) return 'Liên hệ';
    return price.toLocaleString(currency) + 'VND';
};

export const calculateDiscount = (salePrice: number | null, finalPrice: number | null): number => {
    if (salePrice == null || finalPrice == null) return 0;
    return Math.round(((finalPrice - salePrice) / finalPrice) * 100);
};