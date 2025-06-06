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
  categoryId: { _id: string; name: string };
  flashSale_discountedPrice?: number;
  flashSale_start?: string;
  flashSale_end?: string;
  image: string[];
  totalPurchased: number;
  stock_quantity: number;
  isDeleted: boolean;
  status: 'active' | 'hidden' | 'sold_out';
  createdAt: string;
  updatedAt: string;
}
export interface UpdateProductDto {
  id: string;
  name: string;
  price: number;
  description?: string;
  images?: string[];
  categoryId?: string;
  material?: string;
  dimensions?: string;
  weight?: number;
  status?: string;
  descriptionShort?: string;
  descriptionLong?: string;
  importPrice?: number;
  salePrice?: number;
  flashSale_discountedPrice?: number;
  flashSale_start?: string;
  flashSale_end?: string;
}