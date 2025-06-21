export interface Variation {
  _id: string;
  productId: string; // or Product if populated
  name: string; //ten mau bien the
  sku: string; // ma san pham
  dimensions: string; // kich thuoc
  basePrice: number; // gia goc
  priceAdjustment: number; // dieu chinh gia
  finalPrice: number; // gia cuoi cung
  importPrice: number; // gia nhap
  salePrice: number | null; // gia khuyen mai
  stockQuantity: number; // so luong ton kho
  colorName: string; // ten mau
  colorHexCode: string; // ma mau hex
  colorImageUrl: string; // url anh mau
  material?: string | { _id: string; name: string }; // bien the chat lieu
  createdAt: string;
  updatedAt: string;
}
