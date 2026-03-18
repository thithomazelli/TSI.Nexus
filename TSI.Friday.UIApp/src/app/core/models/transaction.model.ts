import { PaymentCondition, PaymentMethod } from '../enums';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentType } from '../enums/payment-type.enum';
import { BaseModel } from './base.model';

export interface Transaction extends BaseModel {
  id?: string;
  date?: Date;
  category?: string;
  description?: string;
  totalOfPayments?: number;
  paymentTotalPrice?: number;
  totalOfExpenses?: number;
  expenseTotalPrice?: number;
  type?: PaymentType;
  status?: PaymentStatus;
  method?: PaymentMethod;
  condition?: PaymentCondition;
  orderId?: string;
  orderNumber?: string;
  businessPartnerId?: string;
  businessPartnerName?: string;
  hasOpenedPayments?: boolean;
  markAllPaymentsAsApproved?: boolean;
}
