import { OrderStatus } from '../enums/order-status.enum';
import { BaseModel } from './base.model';
import { OrderProduct } from './order-product.model';

export interface Order extends BaseModel {
  id?: number;
  orderNumber?: string;
  clientId?: number;
  clientName?: string;
  status?: OrderStatus;
  description?: string;
  discount?: number;
  price?: number;
  totalPrice?: number;
  orderProducts?: OrderProduct[];
}
