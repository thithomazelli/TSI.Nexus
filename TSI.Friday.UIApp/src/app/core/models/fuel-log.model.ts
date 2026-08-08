import { BaseModel } from './base.model';

export interface FuelLog extends BaseModel {
  id: string;
  date: Date;
  odometer: number;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  gasStation: string;
  vehicleId: string;
}
