import { BusinessPartner } from './business-partner.model';

export interface Individual extends BusinessPartner {
  nationalIdCard?: string | null;
  birthday?: Date;
}
