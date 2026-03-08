import { PaymentMethod, PaymentStatus, TransactionType } from '../enums';
import { BaseModel } from './base.model';

export interface Payment extends BaseModel {
  id: string;
  type?: TransactionType;
  status?: PaymentStatus;
  method?: PaymentMethod;
  date?: Date;
  description?: string;
  installmentNumber?: number;
  price?: number;
  transactionId?: string;
  transactionDescription?: string;
  orderId?: string;
  orderNumber?: string;
  businessPartnerId?: string;
  businessPartnerName?: string;
}
