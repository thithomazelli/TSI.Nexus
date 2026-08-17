import { BaseModel } from './base.model';

export interface FeatureToggle extends BaseModel {
  id?: string;
  key?: string;
  name?: string;
  description?: string;
  enabled?: boolean;
}

export const FeatureToggleKeys = {
  FleetModule: 'FleetModule',
} as const;
