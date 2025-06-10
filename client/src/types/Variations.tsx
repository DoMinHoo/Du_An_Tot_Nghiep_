export interface Variation {
  _id: string;
  productId: string; // or Product if populated
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
  materialVariation: string;
  createdAt: string;
  updatedAt: string;
}
