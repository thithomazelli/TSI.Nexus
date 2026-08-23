import {
  BusinessPartnerType,
  PaymentCondition,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from '../enums';
import { BaseModel } from './base.model';

export interface Payment extends BaseModel {
  id: string;
  type?: PaymentType;
  status?: PaymentStatus;
  condition?: PaymentCondition;
  method?: PaymentMethod;
  category?: string;
  date?: Date;
  description?: string;
  paymentNumber?: number;
  price?: number;
  transactionId?: string;
  transactionDescription?: string;
  orderId?: string;
  orderNumber?: string;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  tripId?: string;
  tripNumber?: string;
  businessPartnerId?: string;
  businessPartnerName?: string;
  businessPartnerType?: BusinessPartnerType;
}
