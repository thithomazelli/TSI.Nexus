import { Injectable } from '@angular/core';
import { ApiType } from '../../enums';
import { AgendaEvent } from '../../models';
import { ApiService, WebApiResponse } from '@nexus/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private _baseEndPoint = ApiType.Events;
  private _eventChangedSubject = new BehaviorSubject<void>(undefined);

  eventChanged$ = this._eventChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getAll(): Observable<WebApiResponse<AgendaEvent[]>> {
    return this.apiService.get<WebApiResponse<AgendaEvent[]>>(`${this._baseEndPoint}/getAll`);
  }

  getById(id: string): Observable<WebApiResponse<AgendaEvent>> {
    return this.apiService.get<WebApiResponse<AgendaEvent>>(`${this._baseEndPoint}/getById/${id}`);
  }

  getByUserId(userId: string): Observable<WebApiResponse<AgendaEvent[]>> {
    return this.apiService.get<
      WebApiResponse<AgendaEvent[]>
    >(`${this._baseEndPoint}/getByUserId/${userId}`);
  }

  // entity: one of BusinessPartner/Quote/Order/PurchaseOrder/Trip/Transaction/Payment/Vehicle/
  // Driver/VehicleMaintenance/FuelLog - matches the backend's GetBy{entity}Id endpoints.
  getByEntityId(id: string, entity: string): Observable<WebApiResponse<AgendaEvent[]>> {
    return this.apiService.get<
      WebApiResponse<AgendaEvent[]>
    >(`${this._baseEndPoint}/getBy${entity}Id/${id}`);
  }

  add(event: AgendaEvent): Observable<WebApiResponse<AgendaEvent>> {
    return this.apiService
      .post<WebApiResponse<AgendaEvent>>(`${this._baseEndPoint}/add`, event)
      .pipe(tap(() => this._eventChangedSubject.next()));
  }

  update(event: AgendaEvent): Observable<WebApiResponse<AgendaEvent>> {
    return this.apiService
      .put<WebApiResponse<AgendaEvent>>(`${this._baseEndPoint}/update`, event)
      .pipe(tap(() => this._eventChangedSubject.next()));
  }

  delete(event: AgendaEvent): Observable<WebApiResponse<AgendaEvent>> {
    return this.apiService
      .delete<WebApiResponse<AgendaEvent>>(`${this._baseEndPoint}/remove`, event)
      .pipe(tap(() => this._eventChangedSubject.next()));
  }
}
