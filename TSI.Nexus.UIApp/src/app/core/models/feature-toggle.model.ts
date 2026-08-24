import { BaseModel } from './base.model';

export interface FeatureToggle extends BaseModel {
  id?: string;
  key?: string;
  name?: string;
  description?: string;
  enabled?: boolean;
  groupKey?: string | null;
}

export const FeatureToggleKeys = {
  FleetModule: 'FleetModule',
  FinanceModule: 'FinanceModule',
  QuotesModule: 'QuotesModule',
  SalesOrdersModule: 'SalesOrdersModule',
  PurchaseOrdersModule: 'PurchaseOrdersModule',
  AttachmentsModule: 'AttachmentsModule',
  AgendaModule: 'AgendaModule',
  Trip: 'Trip',
  TripLeg: 'TripLeg',
  Passenger: 'Passenger',
  Driver: 'Driver',
  Vehicle: 'Vehicle',
  DriverLicenseAlert: 'DriverLicenseAlert',
  VehicleBlockedAlert: 'VehicleBlockedAlert',
  Transaction: 'Transaction',
  Payment: 'Payment',
  PaymentAlert: 'PaymentAlert',
  Quote: 'Quote',
  Order: 'Order',
  OrderProduct: 'OrderProduct',
  PurchaseOrder: 'PurchaseOrder',
  StockAlert: 'StockAlert',
  Attachment: 'Attachment',
  FuelLog: 'FuelLog',
  VehicleMaintenance: 'VehicleMaintenance',
  ServiceOrder: 'ServiceOrder',
  Commission: 'Commission',
  Event: 'Event',
  UpcomingEventAlert: 'UpcomingEventAlert',
} as const;
