import { BaseModel } from './base.model';

export interface FuelLog extends BaseModel {
  id: string;
  date: Date;
  odometer: number;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  gasStation: string;
  status: string;
  vehicleId: string;
  vehicle?: { id: string; plate: string } | null;
  productId?: string | null;
  productSku?: string | null;
  productName?: string | null;
}
