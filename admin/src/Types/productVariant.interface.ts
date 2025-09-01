export interface ProductVariation {
  _id: string;
  productId: string;
  name: string;
  sku: string;
  dimensions: string;
  basePrice: number;
  priceAdjustment: number;
  finalPrice: number;
  salePrice: number | null;
  stockQuantity: number;
  colorName: string;
  colorHexCode: string;
  colorImageUrl: string;
  material: {
    _id: string;
    name: string;
  } | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariationFormData {
  _id?: string;// Add optional _id for existing variations
  name: string;
  sku: string;
  dimensions: string;
  basePrice: number;
  priceAdjustment?: number;
  finalPrice: number;
  salePrice?: number | null;
  stockQuantity: number;
  colorName: string;
  colorHexCode: string;
  colorImageUrl: string;
  materialVariation: string;
  colorImageFile?: File;
}

export interface VariationModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (variation: ProductVariationFormData) => void;
  data?: ProductVariationFormData;
  existingSkus?: string[]; // thêm props này
}