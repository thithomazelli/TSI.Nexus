import { OrderStatus } from '../enums/order-status.enum';
import { BaseModel } from './base.model';
import { Transaction } from './transaction.model';
import { TripDriver } from './trip-driver.model';

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
  // Staging-only in Add mode (see trip-form's inline Motoristas grid) - flushed via
  // TripDriverService.add() after the Trip itself is created, then unused (the "Motoristas" tab
  // on trip-details-page manages TripDrivers live from then on).
  tripDrivers?: TripDriver[];
}
