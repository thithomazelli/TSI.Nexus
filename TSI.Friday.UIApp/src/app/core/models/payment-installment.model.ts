import { PaymentCondition, PaymentMethod } from '../enums';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentType } from '../enums/payment-type.enum';
import { BaseModel } from './base.model';

export interface PaymentInstallment extends BaseModel {
  id: number;
  type?: PaymentType;
  status?: PaymentStatus;
  method?: PaymentMethod;
  date?: Date;
  description?: string;
  installmentNumber?: number;
  price?: number;
  orderId?: number;
  orderNumber?: string;
  businessPartnerId?: number;
  businessPartnerName?: string;
}
