export interface OrderProduct {
  id: number;
  description?: string;
  quantity?: number;
  price?: number;
  discount?: number;
  totalPrice?: number;
  orderId?: number;
  productId?: number;
  productName?: string;
  orderNumber?: string;
}
