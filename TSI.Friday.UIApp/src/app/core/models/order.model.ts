import { OrderStatus } from '../enums/order-status.enum';

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  description?: string;
  discount?: number;
  clientId?: number;
  totalPrice?: number;
  clientName?: string;
}
