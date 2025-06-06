import axios from 'axios';
import type { Banner } from '../Types/banner.interface';

export const fetchAllBanners = async (): Promise<Banner[]> => {
    const res = await axios.get('http://localhost:5000/api/banners/all');
    return res.data.data;
};

export const createBanner = async (formData: FormData) => {
    const res = await axios.post('http://localhost:5000/api/banners', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data.data;
};

export const updateBanner = async (id: string, body: Partial<Banner>): Promise<Banner> => {
    const res = await axios.patch(`http://localhost:5000/api/banners/${id}`, body);
    return res.data.data;
};

export const deleteBanner = async (id: string) => {
    return axios.delete(`http://localhost:5000/api/banners/${id}`);
};

export const toggleVisibility = async (id: string, isActive: boolean): Promise<Banner> => {
    const res = await axios.patch(`http://localhost:5000/api/banners/${id}/visibility`, { isActive });
    return res.data.data;
};
