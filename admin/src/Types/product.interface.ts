// Định nghĩa interface cho sản phẩm
export interface Product {
  _id: string;
  name: string;
  descriptionShort: string;
  descriptionLong: string;
  categoryId: { _id: string; name: string }; // Tham chiếu danh mục
  image: string[]; // Mảng đường dẫn ảnh
  totalPurchased: number;
  isDeleted: boolean;
  status: 'active' | 'hidden' | 'sold_out';
  createdAt: string;
  updatedAt: string;
}

// Định nghĩa interface cho dữ liệu cập nhật sản phẩm
export interface UpdateProductDto {
  id: string;
  formData: FormData; // Sử dụng FormData để gửi dữ liệu multipart
}

// Định nghĩa interface cho danh mục
export interface Category {
  _id: string;
  name: string;
}