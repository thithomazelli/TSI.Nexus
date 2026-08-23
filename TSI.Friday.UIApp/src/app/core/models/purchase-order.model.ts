import { OrderStatus } from '../enums/order-status.enum';
import { BaseModel } from './base.model';
import { PurchaseOrderProduct } from './purchase-order-product.model';
import { Transaction } from './transaction.model';

export interface PurchaseOrder extends BaseModel {
  id?: string;
  purchaseOrderNumber?: string;
  date?: Date;
  businessPartnerId?: string;
  businessPartnerName?: string;
  status?: OrderStatus;
  description?: string;
  discount?: number;
  price?: number;
  totalPrice?: number;
  transaction?: Transaction;
  transactionId?: string;
  purchaseOrderProducts?: PurchaseOrderProduct[];
}
