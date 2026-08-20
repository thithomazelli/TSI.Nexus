import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService, ApiType, WebApiResponse, Trip } from '@friday/core';

@Injectable({
  providedIn: 'root',
})
export class TripService {
  private _baseEndPoint = ApiType.Trips;
  private _trips$ = new BehaviorSubject<Trip[]>([]);
  private _tripChangedSubject = new BehaviorSubject<void>(undefined);
  tripChanged$ = this._tripChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getAll(): Observable<WebApiResponse<Trip[]>> {
    return this.apiService
      .get<WebApiResponse<Trip[]>>(`${this._baseEndPoint}/getAll`)
      .pipe(
        tap((response) => {
          this._trips$.next(response.data);
        }),
      );
  }

  getById(tripId: string): Observable<WebApiResponse<Trip>> {
    return this.apiService.get<WebApiResponse<Trip>>(
      `${this._baseEndPoint}/getById/${tripId}`,
    );
  }

  getByBusinessPartnerId(
    businessPartnerId: string,
  ): Observable<WebApiResponse<Trip[]>> {
    return this.apiService
      .get<
        WebApiResponse<Trip[]>
      >(`${this._baseEndPoint}/getByBusinessPartnerId/${businessPartnerId}`)
      .pipe(
        tap((response) => {
          this._trips$.next(response.data);
        }),
      );
  }

  getByDriverId(driverId: string): Observable<WebApiResponse<Trip[]>> {
    return this.apiService
      .get<
        WebApiResponse<Trip[]>
      >(`${this._baseEndPoint}/getByDriverId/${driverId}`)
      .pipe(
        tap((response) => {
          this._trips$.next(response.data);
        }),
      );
  }

  refreshTrips(): Observable<WebApiResponse<Trip[]>> {
    return this.getAll();
  }

  add(trip: Trip): Observable<WebApiResponse<Trip>> {
    return this.apiService
      .post<WebApiResponse<Trip>>(`${this._baseEndPoint}/add`, trip)
      .pipe(tap(() => this._tripChangedSubject.next()));
  }

  update(trip: Trip): Observable<WebApiResponse<Trip>> {
    return this.apiService
      .put<WebApiResponse<Trip>>(`${this._baseEndPoint}/update`, trip)
      .pipe(tap(() => this._tripChangedSubject.next()));
  }

  delete(trip: Trip): Observable<WebApiResponse<Trip>> {
    return this.apiService
      .delete<WebApiResponse<Trip>>(`${this._baseEndPoint}/remove`, trip)
      .pipe(tap(() => this._tripChangedSubject.next()));
  }
}
