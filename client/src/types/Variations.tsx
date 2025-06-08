    export type ProductVariation = {
    _id: string;
    productId: string;
    name: string;
    sku: string;
    price: number;
    importPrice: number;
    salePrice?: number;
    stockQuantity: number;
    colorName: string;
    colorHexCode: string;
    colorImageUrl: string;
    materialVariation: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    };
