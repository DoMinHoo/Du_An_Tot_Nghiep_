// src/Types/promotion.interface.ts
export interface IPromotion {
  _id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiryDate?: string;
  isActive: boolean;
  minOrderValue: number;
  usageLimit: number;
  usedCount: number;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}