export interface IPromotion {
  _id?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  expiryDate?: string; // ISO date string
  isActive?: boolean;
  usageLimit?: number;
  usedCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
