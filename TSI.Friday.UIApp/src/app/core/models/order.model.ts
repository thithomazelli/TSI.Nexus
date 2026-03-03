import { OrderStatus } from '../enums/order-status.enum';
import { BaseModel } from './base.model';
import { OrderProduct } from './order-product.model';
import { Transaction } from './transaction.model';

export interface Order extends BaseModel {
  id?: string;
  orderNumber?: string;
  businessPartnerId?: string;
  businessPartnerName?: string;
  status?: OrderStatus;
  description?: string;
  discount?: number;
  price?: number;
  totalPrice?: number;
  transaction?: Transaction;
  orderProducts?: OrderProduct[];
  hasOpenedProducts?: boolean;
  markAllProductsAsReturned?: boolean;
}
