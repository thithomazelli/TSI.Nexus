import { ProductType } from '../enums';
import { BaseModel } from './base.model';

export interface PurchaseOrderProduct extends BaseModel {
  id: string;
  description?: string;
  readonly previousQuantity?: number;
  quantity?: number;
  discount?: number;
  price?: number;
  totalPrice?: number;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  businessPartnerId?: string;
  businessPartnerName?: string;
  productId?: string;
  productSku?: string;
  productName?: string;
  productType?: ProductType;
}
