import { Address } from './address.model';
import { BaseModel } from './base.model';

export interface Client extends BaseModel {
  id: number;
  name: string;
  email: string;
  phone: string;
  mobile: string;
  photo: string;
  type: string;
  socialSecurityCard?: string | null;
  nationalRegistry: string;
  birthday: Date;
  addresses: Address[];
}
