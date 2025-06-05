import axios from 'axios';
import type { Product, UpdateProductDto } from '../Types/product.interface';
export interface Category {
  _id: string;
  name: string;
}

export const getCategories = async (): Promise<Category[]> => {
  const response = await axios.get('http://localhost:5000/api/categories');
  return response.data;
};

const API_BASE = 'http://localhost:5000/api/products';

export const getProducts = async (): Promise<Product[]> => {
  const response = await axios.get(API_BASE);
  return response.data.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE}/${id}`);
};

interface CreateProductDto {
  name: string;
  price: number;
  description?: string;
  images?: Array<{ url?: string; thumbUrl?: string }>;
}

export const createProduct = async (data: CreateProductDto): Promise<Product> => {
  const images = data.images?.map((file: { url?: string; thumbUrl?: string }) => file.url || file.thumbUrl || '') || [];

  const payload = {
    ...data,
    images,
  };

  const response = await axios.post(API_BASE, payload);
  return response.data.data;
};
export const updateProduct = async (data: UpdateProductDto): Promise<Product> => {
  const response = await axios.put(`http://localhost:5000/api/products/${data.id}`, data);
  return response.data.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await axios.get(`http://localhost:5000/api/products/${id}`);
  return response.data.data;
};


