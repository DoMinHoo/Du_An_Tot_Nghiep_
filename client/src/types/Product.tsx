    export interface Product {
    _id: string;
    name: string;
    brand?: string;
    descriptionShort: string;
    descriptionLong: string;
    material: string;
    categoryId: string;
    image: string[];
    totalPurchased: number;
    isDeleted: boolean;
    status: 'active' | 'hidden' | 'sold_out';
    createdAt: string;
    updatedAt: string;
    }
