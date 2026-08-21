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
  AttachmentsModule: 'AttachmentsModule',
  RentalReport: 'RentalReport',
} as const;
