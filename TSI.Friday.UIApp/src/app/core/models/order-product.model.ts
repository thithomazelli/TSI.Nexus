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
  addressId?: string;
  address?: Address;
  orderId?: string;
  orderNumber?: string;
  productId?: string;
  productSku?: string;
  productName?: string;
  productType?: ProductType;
}
