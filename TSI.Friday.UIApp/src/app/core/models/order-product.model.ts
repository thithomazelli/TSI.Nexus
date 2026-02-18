import { OrderProductStatus, ProductType } from '../enums';
import { Address } from './address.model';
import { BaseModel } from './base.model';

export interface OrderProduct extends BaseModel {
  id: number;
  description?: string;
  readonly previousQuantity?: number;
  quantity?: number;
  discount?: number;
  price?: number;
  totalPrice?: number;
  startDate?: Date;
  endDate?: Date;
  status: OrderProductStatus;
  addressId?: number;
  address?: Address;
  orderId?: number;
  orderNumber?: string;
  productId?: number;
  productSku?: string;
  productName?: string;
  productType?: ProductType;
}
