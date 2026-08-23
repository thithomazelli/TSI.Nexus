import { Injectable } from '@angular/core';
import { ApiType } from '../../enums';
import { EventParticipant } from '../../models';
import { ApiService, WebApiResponse } from '@friday/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventParticipantService {
  private _baseEndPoint = ApiType.EventParticipants;

  constructor(private apiService: ApiService) {}

  getByEventId(eventId: string): Observable<WebApiResponse<EventParticipant[]>> {
    return this.apiService.get<
      WebApiResponse<EventParticipant[]>
    >(`${this._baseEndPoint}/getByEventId/${eventId}`);
  }

  add(participant: EventParticipant): Observable<WebApiResponse<EventParticipant>> {
    return this.apiService.post<
      WebApiResponse<EventParticipant>
    >(`${this._baseEndPoint}/add`, participant);
  }

  delete(participant: EventParticipant): Observable<WebApiResponse<EventParticipant>> {
    return this.apiService.delete<
      WebApiResponse<EventParticipant>
    >(`${this._baseEndPoint}/remove`, participant);
  }
}
