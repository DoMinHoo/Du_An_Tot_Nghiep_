export interface ProductVariation {
  _id: string;
  productId: string; // hoặc Product nếu bạn populate
  name: string; // Tên biến thể (ví dụ: "Sofa 180x85x69 cm")
  sku: string; // Mã SKU duy nhất
  dimensions: string; // Kích thước: "180x85x69 cm"
  basePrice: number; // Giá cơ bản
  priceAdjustment: number; // Điều chỉnh giá (nếu có)
  finalPrice: number; // Giá cuối cùng (basePrice + adjustment)
  importPrice: number; // Giá nhập
  salePrice: number | null; // Giá khuyến mãi (nếu có)

  stockQuantity: number; // Số lượng tồn kho

  colorName: string; // Ví dụ: "Trắng"
  colorHexCode: string; // Mã HEX: "#FFFFFF"
  colorImageUrl: string; // Ảnh minh hoạ màu

  materialVariation: string; // Ví dụ: "Gỗ MFC phủ bóng"

  createdAt: string;
  updatedAt: string;
}
export interface ProductVariationFormData {
  name: string;
  sku: string;
  dimensions: string;
  basePrice: number;
  priceAdjustment: number;
  finalPrice: number;
  importPrice: number;
  salePrice?: number | null; // Có thể không có giá khuyến mãi
  stockQuantity: number;
  colorName: string;
  colorHexCode: string;
  colorImageUrl: string; // URL của ảnh màu
  materialVariation: string; // Ví dụ: "Gỗ MFC phủ bóng"
}
