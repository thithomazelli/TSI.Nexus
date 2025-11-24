import { Address } from './address.model';
import { BaseModel } from './base.model';

export interface Person extends BaseModel {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  addresses?: Address[] | null;
}
