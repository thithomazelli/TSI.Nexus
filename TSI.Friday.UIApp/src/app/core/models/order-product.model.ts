import { OrderProductType } from '../enums/order-product-type.enum';

export interface OrderProduct {
  id: number;
  description?: string;
  type?: OrderProductType;
  readonly previousQuantity?: number;
  quantity?: number;
  price?: number;
  discount?: number;
  totalPrice?: number;
  orderId?: number;
  orderNumber?: string;
  productId?: number;
  productSku?: string;
  productName?: string;
}
