import { TransactionCondition, PaymentMethod } from '../enums';
import { PaymentStatus } from '../enums/payment-status.enum';
import { TransactionType } from '../enums/payment-type.enum';
import { BaseModel } from './base.model';

export interface Transaction extends BaseModel {
  id?: string;
  type?: TransactionType;
  date?: Date;
  category?: string;
  description?: string;
  condition?: TransactionCondition;
  totalOfPayments?: number;
  pricePerInstallment?: number;
  method?: PaymentMethod;
  status?: PaymentStatus;
  price?: number;
  orderId?: string;
  orderNumber?: string;
  businessPartnerId?: string;
  businessPartnerName?: string;
  hasOpenedPayments?: boolean;
  markAllPaymentsAsReturned?: boolean;
}
