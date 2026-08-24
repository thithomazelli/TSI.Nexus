import { Injectable } from '@angular/core';
import { ApiType, ResponseStatus } from '../../enums';
import { TripDriver } from '../../models';
import { ApiService, WebApiResponse } from '@nexus/core';
import { BehaviorSubject, Observable, of, Subject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TripDriverService {
  private _baseEndPoint = ApiType.TripDrivers;
  private _tripDriverChangedSubject = new BehaviorSubject<void>(undefined);
  private _tripDriverAdded$ = new Subject<TripDriver>();

  tripDriverChanged$ = this._tripDriverChangedSubject.asObservable();
  tripDriverAdded$ = this._tripDriverAdded$.asObservable();

  constructor(private apiService: ApiService) {}

  getByTripId(tripId: string): Observable<WebApiResponse<TripDriver[]>> {
    return this.apiService.get<WebApiResponse<TripDriver[]>>(
      `${this._baseEndPoint}/getByTripId/${tripId}`,
    );
  }

  getByDriverId(driverId: string): Observable<WebApiResponse<TripDriver[]>> {
    return this.apiService.get<WebApiResponse<TripDriver[]>>(
      `${this._baseEndPoint}/getByDriverId/${driverId}`,
    );
  }

  add(tripDriver: TripDriver): Observable<WebApiResponse<TripDriver>> {
    return this.apiService
      .post<
        WebApiResponse<TripDriver>
      >(`${this._baseEndPoint}/add`, tripDriver)
      .pipe(tap(() => this._tripDriverChangedSubject.next()));
  }

  addTemporary(tripDriver: TripDriver): Observable<WebApiResponse<TripDriver>> {
    this._tripDriverAdded$.next(tripDriver);
    return of({
      data: tripDriver,
      message: 'Motorista adicionado temporariamente',
      status: ResponseStatus.Success,
    });
  }

  update(tripDriver: TripDriver): Observable<WebApiResponse<TripDriver>> {
    return this.apiService
      .put<
        WebApiResponse<TripDriver>
      >(`${this._baseEndPoint}/update`, tripDriver)
      .pipe(tap(() => this._tripDriverChangedSubject.next()));
  }

  delete(tripDriver: TripDriver): Observable<WebApiResponse<TripDriver>> {
    return this.apiService
      .delete<
        WebApiResponse<TripDriver>
      >(`${this._baseEndPoint}/remove`, tripDriver)
      .pipe(tap(() => this._tripDriverChangedSubject.next()));
  }
}
