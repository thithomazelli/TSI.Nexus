import { PaymentCondition, PaymentMethod } from '../enums';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentType } from '../enums/payment-type.enum';
import { BaseModel } from './base.model';
import { PaymentInstallment } from './payment-installment.model';

export interface Payment extends BaseModel {
  id?: string;
  type?: PaymentType;
  date?: Date;
  category?: string;
  description?: string;
  condition?: PaymentCondition;
  totalOfInstallments?: number;
  pricePerInstallment?: number;
  method?: PaymentMethod;
  status?: PaymentStatus;
  price?: number;
  orderId?: string;
  orderNumber?: string;
  businessPartnerId?: string;
  businessPartnerName?: string;
  installments?: PaymentInstallment[];
}
