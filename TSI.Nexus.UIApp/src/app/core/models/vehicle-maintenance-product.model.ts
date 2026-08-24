import { ProductType } from '../enums';
import { BaseModel } from './base.model';

export interface VehicleMaintenanceProduct extends BaseModel {
  id: string;
  description?: string;
  readonly previousQuantity?: number;
  quantity?: number;
  discount?: number;
  price?: number;
  totalPrice?: number;
  vehicleMaintenanceId?: string;
  productId?: string;
  productSku?: string;
  productName?: string;
  productType?: ProductType;
}
