export type ProductStatus = 'active' | 'hidden' | 'sold_out';

export interface Product {
  _id: string;
  name: string;
  descriptionShort: string;
  descriptionLong: string;
  material: string;
  dimensions: string;
  weight: number;
  price: number;
  importPrice: number;
  salePrice?: number;
  categoryId: string;
  flashSale_discountedPrice?: number;
  flashSale_start?: string;
  flashSale_end?: string;
  images: string[];
  totalPurchased: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}
