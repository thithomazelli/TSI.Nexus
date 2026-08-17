import { OrderStatus } from '../enums/order-status.enum';
import { BaseModel } from './base.model';
import { Transaction } from './transaction.model';

export interface Trip extends BaseModel {
  id?: string;
  tripNumber?: string;
  date?: Date;
  businessPartnerId?: string;
  businessPartnerName?: string;
  status?: OrderStatus;
  discount?: number;
  price?: number;
  totalPrice?: number;
  route?: string;
  distanceKm?: number;
  dailyCount?: number;
  transportLicenseNumber?: string | null;
  transportLicenseExpiryDate?: Date | null;
  vehicleId?: string | null;
  vehiclePlate?: string | null;
  driverId?: string | null;
  driverName?: string | null;
  quoteNumber?: string | null;
  transaction?: Transaction;
  transactionId?: string;
}
