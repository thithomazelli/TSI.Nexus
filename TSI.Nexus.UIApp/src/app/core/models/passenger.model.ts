import { BaseModel } from './base.model';

export interface Passenger extends BaseModel {
  id: string;
  name: string;
  documentNumber: string;
  seat: string;
  phone: string;
  tripId: string;
}
