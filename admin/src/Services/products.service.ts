import axios from 'axios';
import type { Product, UpdateProductDto, Category } from '../Types/product.interface';

// URL cơ sở cho API sản phẩm
const API_BASE = 'http://localhost:5000/api/products';

// Lấy danh sách danh mục
export const getCategories = async (): Promise<Category[]> => {
  const response = await axios.get('http://localhost:5000/api/categories');
  return response.data;
};

// Lấy danh sách sản phẩm
export const getProducts = async (): Promise<Product[]> => {
  const response = await axios.get(API_BASE);
  return response.data.data;
};

// Tạo sản phẩm mới
export const createProduct = async (data: FormData): Promise<Product> => {
  const response = await axios.post(API_BASE, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

// Cập nhật sản phẩm
export const updateProduct = async (data: UpdateProductDto): Promise<Product> => {
  const response = await axios.put(`${API_BASE}/${data.id}`, data.formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

// Lấy chi tiết sản phẩm theo ID
export const getProductById = async (id: string): Promise<Product> => {
  const response = await axios.get(`${API_BASE}/${id}`);
  return response.data.data;
};

// Xóa mềm sản phẩm
export const deleteProduct = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE}/${id}`);
};

// Lấy danh sách vật liệu của sản phẩm
export const getProductMaterials = async (productId: string): Promise<string> => {
  const res = await fetch(`/api/products/${productId}/materials`);
  if (!res.ok) throw new Error("Failed to fetch materials");
  const data = await res.json();
  return data.materials || "N/A"; // ✅ lấy đúng field
};