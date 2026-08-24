import { BaseModel } from './base.model';

export interface TripDriver extends BaseModel {
  id: string;
  amount?: number;
  tripId?: string;
  tripNumber?: string;
  driverId?: string;
  driverName?: string;
  driverLicenseNumber?: string;
  driverLicenseExpiryDate?: Date;
  paymentId?: string;
}
