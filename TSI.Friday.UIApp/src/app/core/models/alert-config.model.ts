import { BaseModel } from './base.model';

export interface AlertConfig extends BaseModel {
  id?: string;
  key?: string;
  name?: string;
  description?: string;
  enabled?: boolean;
  thresholdDays?: number | null;
}

export const AlertConfigKeys = {
  VehicleMaintenanceOverdue: 'VehicleMaintenanceOverdue',
  DashboardOverdueReturns: 'DashboardOverdueReturns',
  DriverLicenseExpiry: 'DriverLicenseExpiry',
  UpcomingEventReminder: 'UpcomingEventReminder',
} as const;
