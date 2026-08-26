import { BaseModel } from './base.model';

export interface QuoteTripLeg extends BaseModel {
  id: string;
  sequenceNumber: number;
  origin: string;
  destination: string;
  departureDate: Date;
  arrivalDate?: Date | null;
  distanceKm: number;
  notes: string;
  quoteTripId: string;
}
