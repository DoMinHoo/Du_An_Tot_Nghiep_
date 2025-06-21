    import axios from 'axios';
    import { API_BASE_URL } from '../constants/api';
    import type { Product } from '../types/Product';
    import type { Variation } from '../types/Variations';

    export const fetchProducts = async (params: {
    page?: number;
    limit?: number;
    sort?: string;
    status?: string;
    filter?: string;
    flashSaleOnly?: boolean;
    }): Promise<Product[]> => {
    const response = await axios.get(`${API_BASE_URL}/products`, { params });
    return response.data.data || [];
    };

    export const fetchVariations = async (productId: string): Promise<Variation[]> => {
    const response = await axios.get(`${API_BASE_URL}/${productId}/variations`);
    if (!response.data.success) {
        throw new Error(response.data.message || 'Lỗi từ server');
    }
    return response.data.data || [];
    };

    export const fetchProduct = async (productId: string): Promise<Product> => {
    const response = await axios.get(`${API_BASE_URL}/products/${productId}`);
    if (!response.data.success) {
        throw new Error(response.data.message || 'Không thể tải thông tin sản phẩm');
    }
    return response.data.data;
    };