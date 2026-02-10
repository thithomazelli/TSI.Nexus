import { PaymentCondition, PaymentMethod } from '../enums';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentType } from '../enums/payment-type.enum';

export interface Payment {
  id: number;
  type?: PaymentType;
  method?: PaymentMethod;
  status?: PaymentStatus;
  date?: Date;
  category?: string;
  description?: string;
  price?: number;
  condition?: PaymentCondition;
  installments?: number;
  pricePerInstallment?: number;
  orderId?: number;
  orderNumber?: string;
  clientId?: number;
  clientName?: string;
}
