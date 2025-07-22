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
  return response.data;
};

// Cập nhật sản phẩm
export const updateProduct = async (data: UpdateProductDto): Promise<Product> => {
  const response = await axios.put(`${API_BASE}/${data.id}`, data.formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Lấy chi tiết sản phẩm theo ID
export const getProductById = async (id: string): Promise<Product> => {
  const response = await axios.get(`${API_BASE}/${id}`);
  return response.data.data;
};

// Xóa mềm sản phẩm
export const softDeleteProduct = async (id: string): Promise<void> => {
  const response = await axios.delete(`${API_BASE}/soft/${id}`);
  return response.data;
};

// Xóa vĩnh viễn sản phẩm
export const hardDeleteProduct = async (id: string): Promise<void> => {
  const response = await axios.delete(`${API_BASE}/hard/${id}`);
  return response.data;
};

// Khôi phục sản phẩm đã xóa mềm
export const restoreProduct = async (id: string): Promise<Product> => {
  const response = await axios.patch(`${API_BASE}/restore/${id}`);
  return response.data.data;
};

// Lấy danh sách vật liệu của sản phẩm
export const getProductMaterials = async (productId: string): Promise<string> => {
  const res = await fetch(`${API_BASE}/${productId}/materials`);
  if (!res.ok) throw new Error("Không thể lấy danh sách chất liệu");
  const data = await res.json();
  return data.materials || "N/A";
};