import type { Variation } from './Variations';

export interface Cart {
  _id: string;
  userId?: string;
  guestId?: string;
  items: CartItem[];
}

export interface CartItem {
  variationId: Variation;
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  message: string;
  data: {
    cart?: Cart;
    totalPrice?: number;
    guestId?: string;
  };
}
