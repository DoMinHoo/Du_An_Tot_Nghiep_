// src/Types/productVariant.interface.ts

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
  colorImageUrl: string;            // URL (may be temporary object URL)
  materialVariation: string;        // material _id (string)
  // --- addon: file object (optional) ---
  colorImageFile?: File;            // <-- optional, parent will upload this
}

export interface VariationModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (variation: ProductVariationFormData) => void;
  data?: ProductVariationFormData;
}
