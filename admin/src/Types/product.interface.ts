import type { ProductVariation } from "./productVariant.interface";

export interface Product {
  _id: string;
  name: string;
  descriptionShort: string;
  descriptionLong: string;
  categoryId: { _id: string; name: string };
  image: string[];
  totalPurchased: number;
  isDeleted: boolean;
  status: 'active' | 'hidden' | 'sold_out';
  createdAt: string;
  updatedAt: string;
  variations: ProductVariation[]; // Add variations field
}

export interface UpdateProductDto {
  id: string;
  formData: FormData;
}

export interface Category {
  _id: string;
  name: string;
}