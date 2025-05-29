import axios from 'axios';
import type { Product } from '../Types/product.interface';


export const getProducts = async (): Promise<Product[]> => {
  const res = await axios.get('/api/products');
  return res.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await axios.delete(`/api/products/${id}`);
};
