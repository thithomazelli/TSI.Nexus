import { PaymentCondition, PaymentMethod } from '../enums';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentType } from '../enums/payment-type.enum';

export interface PaymentInstallment {
  id: number;
  type?: PaymentType;
  method?: PaymentMethod;
  status?: PaymentStatus;
  date?: Date;
  category?: string;
  description?: string;
  price?: number;
  condition?: PaymentCondition;
  installmentNumber?: number;
  orderId?: number;
  clientId?: number;
}
