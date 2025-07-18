// src/services/ghnService.ts
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/shipping"; // hoặc domain thật nếu bạn deploy

export const getProvinces = () => {
    return axios.get(`${API_BASE_URL}/provinces`).then((res) => res.data);
};

export const getDistricts = (provinceId: number) => {
    return axios
        .get(`${API_BASE_URL}/districts/${provinceId}`)
        .then((res) => res.data);
};

export const getWards = (districtId: number) => {
    return axios
        .get(`${API_BASE_URL}/wards/${districtId}`)
        .then((res) => res.data);
};

export const calculateShippingFee = ({
    toDistrictId,
    toWardCode,
    amount,
}: {
    toDistrictId: number;
    toWardCode: string;
    amount: number;
}) => {
    // Đảm bảo dùng POST, không phải GET
    return axios
        .post(`${API_BASE_URL}/fee`, {
            toDistrictId,
            toWardCode,
            amount,
        })
        .then((res) => res.data.fee);
};