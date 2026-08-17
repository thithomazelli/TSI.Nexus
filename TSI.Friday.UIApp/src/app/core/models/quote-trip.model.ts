import { BaseModel } from './base.model';

export interface QuoteTrip extends BaseModel {
  id?: string;
  route?: string;
  distanceKm?: number;
  dailyCount?: number;
  transportLicenseNumber?: string | null;
  transportLicenseExpiryDate?: Date | null;
  vehicleId?: string | null;
  driverId?: string | null;
  quoteId?: string;
}
