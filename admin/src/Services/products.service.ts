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

export const createProduct = async (data: FormData): Promise<Product> => {
  const response = await axios.post(API_BASE, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateProduct = async (data: UpdateProductDto): Promise<Product> => {
  const response = await axios.put(`${API_BASE}/${data.id}`, data);
  return response.data.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  const response = await axios.get(`${API_BASE}/${id}`);
  return response.data.data;
};