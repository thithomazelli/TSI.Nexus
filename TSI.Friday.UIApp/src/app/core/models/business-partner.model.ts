import { Address } from './address.model';
import { BaseModel } from './base.model';

export interface BusinessPartner extends BaseModel {
  id: number;
  name: string;
  email: string;
  phone: string;
  mobile: string;
  photo: string;
  documentType: string;
  type: string;
  socialSecurityCard?: string | null;
  nationalRegistry: string;
  birthday: Date;
  addresses: Address[];
}
