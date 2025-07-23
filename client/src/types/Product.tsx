    export interface Product {
    _id: string;
    name: string;
    brand?: string;
    descriptionShort: string;
    descriptionLong: string;
    categoryId: string;
    image: string[];
    totalPurchased: number;
    isDeleted: boolean;
    status: 'active' | 'hidden' | 'sold_out';
    averageRating?: number; 
    numOfReviews?: number;
    createdAt: string;
    updatedAt: string;
    }
