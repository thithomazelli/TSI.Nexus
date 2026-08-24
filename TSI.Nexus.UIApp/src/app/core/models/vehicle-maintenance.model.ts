import { MaintenanceStatus } from '../enums/maintenance-status.enum';
import { MaintenanceType } from '../enums/maintenance-type.enum';
import { BaseModel } from './base.model';
import { VehicleMaintenanceProduct } from './vehicle-maintenance-product.model';

export interface VehicleMaintenance extends BaseModel {
  id: string;
  type: MaintenanceType;
  description: string;
  scheduledDate: Date;
  completedDate?: Date | null;
  odometerAtService?: number | null;
  cost: number;
  status: MaintenanceStatus;
  vehicleId: string;
  vehicle?: { id: string; plate: string } | null;
  vehicleMaintenanceProducts?: VehicleMaintenanceProduct[];
}
