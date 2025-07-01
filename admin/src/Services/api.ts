    import axios, { type AxiosResponse } from 'axios';
    import type { ApiResponse, StatsOrders, StatsOverview, StatsProducts, StatsRevenue, StatsUsers } from '../Types/dashboard';

    const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    });

    // Thêm token và header chống cache
    api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        }
        // Ngăn cache để đảm bảo yêu cầu mới
        config.headers['Cache-Control'] = 'no-cache';
        config.headers['Pragma'] = 'no-cache';
        config.headers['Expires'] = '0';
        return config;
    },
    (error) => Promise.reject(error)
    );

    interface StatsParams {
    startDate?: string;
    endDate?: string;
    }

    export const fetchStats = {
    overview: (params: StatsParams = {}): Promise<AxiosResponse<ApiResponse<StatsOverview>>> =>
        api.get('/stats/overview', { params }),
    orders: (params: StatsParams = {}): Promise<AxiosResponse<ApiResponse<StatsOrders>>> =>
        api.get('/stats/orders', { params }),
    products: (params: StatsParams = {}): Promise<AxiosResponse<ApiResponse<StatsProducts>>> =>
        api.get('/stats/products', { params }),
    users: (params: StatsParams = {}): Promise<AxiosResponse<ApiResponse<StatsUsers>>> =>
        api.get('/stats/users', { params }),
    revenue: (params: StatsParams = {}): Promise<AxiosResponse<ApiResponse<StatsRevenue>>> =>
        api.get('/stats/revenue', { params }),
    };

    export default api;