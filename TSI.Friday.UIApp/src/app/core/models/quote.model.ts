import { PaymentCondition, PaymentMethod } from '../enums';
import { QuoteStatus } from '../enums/quote-status.enum';
import { QuoteProduct } from './quote-product.model';

export interface Quote {
  id?: string;
  orderNumber?: string;
  date?: Date;
  businessPartnerId?: string;
  businessPartnerName?: string;
  status?: QuoteStatus;
  createDate?: Date;
  description?: string;
  discount?: number;
  price?: number;
  totalPrice?: number;
  quoteProducts?: QuoteProduct[];
  condition?: PaymentCondition;
  method?: PaymentMethod;
  totalOfPayments?: number;
  paymentTotalPrice?: number;
  totalOfExpenses?: number;
  expenseTotalPrice?: number;
}
