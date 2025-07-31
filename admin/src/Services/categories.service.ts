import axios from "axios";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/categories`;

export const getCategories = () =>
  axios.get(API_URL).then((res) => res.data); // Lấy danh mục chưa xóa

export const getDeletedCategories = () =>
  axios.get(`${API_URL}/deleted`).then((res) => res.data); // Lấy danh mục đã xóa mềm

export const getCategoriesWithChildren = () =>
  axios.get(`${API_URL}/all/with-children`).then((res) => res.data);

export const createCategory = (data: any) =>
  axios.post(API_URL, data).then((res) => res.data);

export const updateCategory = (id: string, data: any) =>
  axios.put(`${API_URL}/${id}`, data).then((res) => res.data);

export const deleteCategory = (id: string) =>
  axios.delete(`${API_URL}/${id}`).then((res) => res.data); // Xóa mềm

export const restoreCategory = (id: string) =>
  axios.post(`${API_URL}/restore/${id}`).then((res) => res.data); // Khôi phục

export const hardDeleteCategory = (id: string) =>
  axios.delete(`${API_URL}/permanent/${id}`).then((res) => res.data); // Xóa vĩnh viễn