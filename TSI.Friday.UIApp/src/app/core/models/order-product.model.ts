import { OrderProductStatus, ProductType } from '../enums';
import { BaseModel } from './base.model';

export interface OrderProduct extends BaseModel {
  id: string;
  description?: string;
  readonly previousQuantity?: number;
  quantity?: number;
  discount?: number;
  price?: number;
  totalPrice?: number;
  startDate?: Date;
  endDate?: Date;
  status: OrderProductStatus;
  orderId?: string;
  orderNumber?: string;
  businessPartnerId?: string;
  businessPartnerName?: string;
  productId?: string;
  productSku?: string;
  productName?: string;
  productType?: ProductType;
}
