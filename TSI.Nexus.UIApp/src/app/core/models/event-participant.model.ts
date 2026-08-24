export interface EventParticipant {
  id: string;
  eventId?: string;
  userId?: string | null;
  name?: string | null;
  email?: string | null;
  displayName?: string | null;
}
