
// src/Services/categories.service.ts
import axios from "axios";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/categories`;

export const getCategories = () =>
  axios.get(API_URL).then((res) => res.data); // ✅ TRẢ MẢNG TRỰC TIẾP

export const getCategoriesWithChildren = () =>
  axios.get(`${API_URL}/all/with-children`).then((res) => res.data);

export const createCategory = (data: any) =>
  axios.post(API_URL, data);

export const updateCategory = (id: string, data: any) =>
  axios.put(`${API_URL}/${id}`, data).then((res) => res.data);

export const deleteCategory = (id: string) =>
  axios.delete(`${API_URL}/${id}`).then((res) => res.data);