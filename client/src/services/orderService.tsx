import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

export interface CreateOrderPayload {
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    addressLine: string;
    street: string;
    province: string;
    district: string;
    ward: string;
  };
  paymentMethod: 'cod' | 'bank_transfer' | 'online_payment';
  cartId: string;
  couponCode?: string; // Thêm dòng này
}

export interface OrderResponse {
  success: boolean;
  message: string;
  orderCode: string;
  order: {
    _id: string;
    orderCode: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  };
}

const orderApi = axios.create({
  baseURL: `${API_BASE_URL}/orders`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createOrder = async (
  payload: CreateOrderPayload,
  token?: string,
  guestId?: string
): Promise<OrderResponse> => {
  try {
    const response = await orderApi.post('/', payload, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        'X-Guest-Id': guestId || undefined,
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message || 'Lỗi khi tạo đơn hàng';
      throw new Error(message);
    }
    throw error;
  }
};

// Giữ nguyên các hàm khác nếu bạn dùng

// ==========================
// API: Lấy đơn hàng theo mã (nếu cần xem lại đơn hàng sau khi thanh toán)
// ==========================
export const getOrderByCode = async (
  orderCode: string,
  token?: string
): Promise<OrderResponse> => {
  try {
    const response = await orderApi.get(`/${orderCode}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message || 'Không thể lấy đơn hàng';
      throw new Error(message);
    }
    throw error;
  }
};

// ==========================
// API: Hủy đơn hàng (nếu có chức năng hủy)
// ==========================
export const cancelOrder = async (
  orderCode: string,
  reason: string,
  token: string
): Promise<OrderResponse> => {
  try {
    const response = await orderApi.post(
      `/cancel/${orderCode}`,
      { reason },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message || 'Không thể hủy đơn hàng';
      throw new Error(message);
    }
    throw error;
  }
};
