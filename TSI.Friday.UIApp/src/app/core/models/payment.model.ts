import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentType } from '../enums/payment-type.enum';

export interface Payment {
  id: number;
  description?: string;
  price?: number;
  discount?: number;
  totalPrice?: number;
  status?: PaymentStatus;
  type?: PaymentType;
  installments?: number;
  totalPerInstallment?: number;
  orderId?: number;
  clientId?: number;
}
