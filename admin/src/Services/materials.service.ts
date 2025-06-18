import axios from "axios";
import type { Material, MaterialResponse } from "../Types/materials.interface";

const BASE_URL = "http://localhost:5000/api/materials";

export const getMaterials = async (page = 1): Promise<MaterialResponse> => {
    const res = await axios.get(BASE_URL + `?page=${page}`);
    return res.data;
};

export const createMaterial = async (data: { name: string }): Promise<Material> => {
    const res = await axios.post(BASE_URL, data);
    return res.data;
};

export const updateMaterial = async (
    id: string,
    data: { name: string }
): Promise<Material> => {
    const res = await axios.put(`${BASE_URL}/${id}`, data);
    return res.data;
};

export const deleteMaterial = async (id: string): Promise<void> => {
    await axios.delete(`${BASE_URL}/${id}`);
};
