import { Injectable } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@nexus/core';
import { TripLeg } from '@nexus/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TripLegService {
  private _baseEndPoint = ApiType.TripLegs;
  private _tripLegChangedSubject = new BehaviorSubject<void>(undefined);
  tripLegChanged$ = this._tripLegChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getByTrip(tripId: string): Observable<WebApiResponse<TripLeg[]>> {
    return this.apiService.get<WebApiResponse<TripLeg[]>>(
      `${this._baseEndPoint}/getByTrip/${tripId}`,
    );
  }

  add(tripLeg: TripLeg): Observable<WebApiResponse<TripLeg>> {
    return this.apiService
      .post<WebApiResponse<TripLeg>>(`${this._baseEndPoint}/add`, tripLeg)
      .pipe(tap(() => this._tripLegChangedSubject.next()));
  }

  update(tripLeg: TripLeg): Observable<WebApiResponse<TripLeg>> {
    return this.apiService
      .put<WebApiResponse<TripLeg>>(`${this._baseEndPoint}/update`, tripLeg)
      .pipe(tap(() => this._tripLegChangedSubject.next()));
  }

  delete(tripLeg: TripLeg): Observable<WebApiResponse<TripLeg>> {
    return this.apiService
      .delete<WebApiResponse<TripLeg>>(`${this._baseEndPoint}/remove`, tripLeg)
      .pipe(tap(() => this._tripLegChangedSubject.next()));
  }
}
