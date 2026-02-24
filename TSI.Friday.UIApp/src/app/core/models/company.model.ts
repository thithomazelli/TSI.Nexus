import { BusinessPartner } from './business-partner.model';

export interface Company extends BusinessPartner {
  stateRegistration: string;
  businessName: string;
}
