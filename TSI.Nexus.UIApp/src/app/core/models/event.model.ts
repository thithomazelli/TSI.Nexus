import { BaseModel } from './base.model';
import { EventParticipant } from './event-participant.model';

// Named AgendaEvent, not Event, to avoid shadowing the global DOM Event type (and
// @angular/router's own deprecated Event export) everywhere this model is imported.
export interface AgendaEvent extends BaseModel {
  id: string;
  title?: string;
  description?: string | null;
  startDate?: Date;
  endDate?: Date;
  eventTypeOptionId?: string;
  eventTypeName?: string | null;
  eventTypeColor?: string | null;
  createdByUserId?: string;
  createdByUserName?: string | null;

  businessPartnerId?: string | null;
  quoteId?: string | null;
  orderId?: string | null;
  purchaseOrderId?: string | null;
  tripId?: string | null;
  transactionId?: string | null;
  paymentId?: string | null;
  vehicleId?: string | null;
  driverId?: string | null;
  vehicleMaintenanceId?: string | null;
  fuelLogId?: string | null;

  linkedEntityType?: string | null;
  linkedEntityLabel?: string | null;

  participants?: EventParticipant[];

  // Client-only, never round-tripped through the API: marks an entry that isn't a real Event
  // row (see EventListComponent's extraEvents input) - a linked entity's own dates (e.g. a
  // Trip's departure/arrival span) rendered as a calendar card without a duplicate Event
  // record. Clicking it navigates to the linked entity instead of opening the Event form, and
  // it has no delete action.
  readOnly?: boolean;
}
