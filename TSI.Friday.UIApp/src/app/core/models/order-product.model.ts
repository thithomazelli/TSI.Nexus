import { OrderProductStatus, ProductType } from '../enums';
import { Address } from './address.model';
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
  addressId?: string;
  address?: Address;
  productId?: string;
  productSku?: string;
  productName?: string;
  productType?: ProductType;
}
