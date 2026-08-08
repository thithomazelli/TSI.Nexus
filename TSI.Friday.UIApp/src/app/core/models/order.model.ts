import { OrderStatus } from '../enums/order-status.enum';
import { BaseModel } from './base.model';
import { OrderProduct } from './order-product.model';
import { Transaction } from './transaction.model';

export interface Order extends BaseModel {
  id?: string;
  orderNumber?: string;
  date?: Date;
  businessPartnerId?: string;
  businessPartnerName?: string;
  status?: OrderStatus;
  description?: string;
  discount?: number;
  price?: number;
  totalPrice?: number;
  quoteId?: string;
  quoteNumber?: string;
  transaction?: Transaction;
  transactionId?: string;
  orderProducts?: OrderProduct[];
  hasOpenedProducts?: boolean;
  markAllProductsAsReturned?: boolean;
  route?: string;
  distanceKm?: number;
  dailyCount?: number;
  transportLicenseNumber?: string | null;
  transportLicenseExpiryDate?: Date | null;
  vehicleId?: string | null;
  vehiclePlate?: string | null;
  driverId?: string | null;
  driverName?: string | null;
}
