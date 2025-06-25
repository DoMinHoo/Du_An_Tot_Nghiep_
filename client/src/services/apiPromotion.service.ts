// src/services/promotionService.ts
export const getAllPromotions = async () => {
    const res = await fetch("http://localhost:5000/api/promotions");
    if (!res.ok) throw new Error("Lấy danh sách mã thất bại");
    return res.json();
};
