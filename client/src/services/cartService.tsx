import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import type { CartResponse } from '../types/Cart';

const cartApi = axios.create({
  baseURL: `${API_BASE_URL}/carts`,
  headers: { 'Content-Type': 'application/json' },
});

export const getCart = async (
  token?: string,
  guestId?: string
): Promise<CartResponse> => {
  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!token && guestId) headers['X-Guest-Id'] = guestId;

    const response = await cartApi.get('/', { headers });
    if (response.data.data.guestId && !token) {
      sessionStorage.setItem('guestId', response.data.data.guestId);
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data.message || 'Lỗi khi lấy giỏ hàng');
    }
    throw error;
  }
};

export const addToCart = async (
  variationId: string,
  quantity: number,
  token?: string,
  guestId?: string
): Promise<CartResponse> => {
  if (!variationId) {
    throw new Error('variationId is required');
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Quantity must be a positive integer');
  }

  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!token && guestId) headers['X-Guest-Id'] = guestId;

    const response = await cartApi.post(
      '/add',
      { variationId, quantity },
      { headers }
    );
    if (response.data.data.guestId && !token) {
      sessionStorage.setItem('guestId', response.data.data.guestId);
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data.message || 'Lỗi khi thêm vào giỏ hàng'
      );
    }
    throw error;
  }
};

export const updateCartItem = async (
  variationId: string,
  quantity: number,
  token?: string,
  guestId?: string
): Promise<CartResponse> => {
  if (!variationId) {
    throw new Error('variationId is required');
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Quantity must be a positive integer');
  }

  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!token && guestId) headers['X-Guest-Id'] = guestId;

    const response = await cartApi.put(
      '/update',
      { variationId, quantity },
      { headers }
    );
    if (response.data.data.guestId && !token) {
      sessionStorage.setItem('guestId', response.data.data.guestId);
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data.message || 'Lỗi khi cập nhật số lượng'
      );
    }
    throw error;
  }
};

export const removeCartItem = async (
  variationId: string,
  token?: string,
  guestId?: string
): Promise<CartResponse> => {
  if (!variationId) {
    throw new Error('variationId is required');
  }

  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!token && guestId) headers['X-Guest-Id'] = guestId;

    const response = await cartApi.delete(`/remove/${variationId}`, {
      headers,
    });
    if (response.data.data?.guestId && !token) {
      sessionStorage.setItem('guestId', response.data.data.guestId);
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data.message || 'Lỗi khi xóa sản phẩm');
    }
    throw error;
  }
};

export const deleteMultipleCartItems = async (
  variationIds: string[],
  token?: string,
  guestId?: string
): Promise<CartResponse> => {
  if (
    !variationIds ||
    !Array.isArray(variationIds) ||
    variationIds.length === 0
  ) {
    throw new Error('variationIds là bắt buộc và phải là một mảng không rỗng');
  }

  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!token && guestId) headers['X-Guest-Id'] = guestId;

    const response = await cartApi.delete('/remove-multiple', {
      headers,
      data: { variationIds },
    });
    if (!response.data.data || !response.data.data.cart) {
      sessionStorage.removeItem('guestId');
    }
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data.message || 'Lỗi khi xóa các sản phẩm'
      );
    }
    throw error;
  }
};

export const clearCart = async (
  token?: string,
  guestId?: string
): Promise<CartResponse> => {
  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!token && guestId) headers['X-Guest-Id'] = guestId;

    const response = await cartApi.delete('/clear', { headers });
    sessionStorage.removeItem('guestId');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data.message || 'Lỗi khi xóa giỏ hàng');
    }
    throw error;
  }
};
