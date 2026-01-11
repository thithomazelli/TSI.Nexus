import { Client } from './client.model';

export interface Company extends Client {
  stateRegistration: string;
  businessName: string;
}
