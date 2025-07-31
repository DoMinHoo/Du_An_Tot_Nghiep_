// src/services/promotion.service.ts
import axios from 'axios';
import type { IPromotion } from '../Types/promotion.interface';

const API_URL = 'http://localhost:5000/api/promotions';

export const fetchPromotions = async (): Promise<IPromotion[]> => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const fetchDeletedPromotions = async (): Promise<IPromotion[]> => {
  const res = await axios.get(`${API_URL}/deleted`);
  return res.data;
};

export const createPromotion = async (data: IPromotion): Promise<IPromotion> => {
  const res = await axios.post(API_URL, data);
  return res.data;
};

export const updatePromotion = async (id: string, data: IPromotion): Promise<IPromotion> => {
  const res = await axios.put(`${API_URL}/${id}`, data);
  return res.data;
};

export const getPromotionById = async (id: string): Promise<IPromotion> => {
  const res = await axios.get(`${API_URL}/${id}`);
  return res.data;
};

export const softDeletePromotion = async (id: string): Promise<{ message: string; promo: IPromotion }> => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};

export const restorePromotion = async (id: string): Promise<{ message: string; promo: IPromotion }> => {
  const res = await axios.put(`${API_URL}/${id}/restore`);
  return res.data;
};

export const permanentDeletePromotion = async (id: string): Promise<{ message: string }> => {
  const res = await axios.delete(`${API_URL}/${id}/permanent`);
  return res.data;
};