import { PaymentCondition, PaymentMethod } from '../enums';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentType } from '../enums/payment-type.enum';
import { BaseModel } from './base.model';
import { PaymentInstallment } from './payment-installment.model';

export interface Payment extends BaseModel {
  id: number;
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
  orderId?: number;
  orderNumber?: string;
  clientId?: number;
  clientName?: string;
  installments?: PaymentInstallment[];
}
