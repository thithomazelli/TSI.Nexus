import { PaymentCondition, PaymentMethod } from '../enums';
import { QuoteStatus } from '../enums/quote-status.enum';
import { QuoteType } from '../enums/quote-type.enum';
import { QuoteProduct } from './quote-product.model';

export interface Quote {
  id?: string;
  quoteNumber?: string;
  date?: Date;
  businessPartnerId?: string;
  businessPartnerName?: string;
  status?: QuoteStatus;
  type?: QuoteType;
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
