import { Injectable } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@friday/core';
import { Passenger } from '@friday/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PassengerService {
  private _baseEndPoint = ApiType.Passengers;
  private _passengerChangedSubject = new BehaviorSubject<void>(undefined);
  passengerChanged$ = this._passengerChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getByOrder(orderId: string): Observable<WebApiResponse<Passenger[]>> {
    return this.apiService.get<WebApiResponse<Passenger[]>>(
      `${this._baseEndPoint}/getByOrder/${orderId}`,
    );
  }

  add(passenger: Passenger): Observable<WebApiResponse<Passenger>> {
    return this.apiService
      .post<WebApiResponse<Passenger>>(`${this._baseEndPoint}/add`, passenger)
      .pipe(tap(() => this._passengerChangedSubject.next()));
  }

  addRange(
    passengers: Passenger[],
  ): Observable<WebApiResponse<Passenger[]>> {
    return this.apiService
      .post<WebApiResponse<Passenger[]>>(`${this._baseEndPoint}/addRange`, passengers)
      .pipe(tap(() => this._passengerChangedSubject.next()));
  }

  update(passenger: Passenger): Observable<WebApiResponse<Passenger>> {
    return this.apiService
      .put<WebApiResponse<Passenger>>(`${this._baseEndPoint}/update`, passenger)
      .pipe(tap(() => this._passengerChangedSubject.next()));
  }

  delete(passenger: Passenger): Observable<WebApiResponse<Passenger>> {
    return this.apiService
      .delete<WebApiResponse<Passenger>>(`${this._baseEndPoint}/remove`, passenger)
      .pipe(tap(() => this._passengerChangedSubject.next()));
  }
}
