export interface Variation {
  _id: string;
  productId: { _id: string; name: string }; // đã populate
  name: string;
  sku: string;
  dimensions: string;
  basePrice: number;
  priceAdjustment: number;
  finalPrice: number;
  importPrice: number;
  salePrice: number | null;
  stockQuantity: number;
  colorName: string;
  colorHexCode: string;
  colorImageUrl: string;
  material?: string | { _id: string; name: string };
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}
