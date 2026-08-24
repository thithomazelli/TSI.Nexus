import { VehicleStatus } from '../enums/vehicle-status.enum';
import { VehicleType } from '../enums/vehicle-type.enum';
import { BaseModel } from './base.model';

export interface Vehicle extends BaseModel {
  id: string;
  plate: string;
  renavam: string;
  chassis: string;
  brand: string;
  model: string;
  manufactureYear: number;
  modelYear: number;
  seatCapacity: number;
  type: VehicleType;
  status: VehicleStatus;
  pricePerKm: number;
  dailyRate: number;
  odometer: number;
  photo?: string;
}
