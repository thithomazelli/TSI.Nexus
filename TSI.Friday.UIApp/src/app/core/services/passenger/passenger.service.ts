import { Injectable } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@friday/core';
import { Passenger } from '@friday/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PassengerService {
  private _baseEndPoint = ApiType.Passengers;

  constructor(private apiService: ApiService) {}

  getByOrder(orderId: string): Observable<WebApiResponse<Passenger[]>> {
    return this.apiService.get<WebApiResponse<Passenger[]>>(
      `${this._baseEndPoint}/getByOrder/${orderId}`,
    );
  }

  add(passenger: Passenger): Observable<WebApiResponse<Passenger>> {
    return this.apiService.post<WebApiResponse<Passenger>>(
      `${this._baseEndPoint}/add`,
      passenger,
    );
  }

  addRange(
    passengers: Passenger[],
  ): Observable<WebApiResponse<Passenger[]>> {
    return this.apiService.post<WebApiResponse<Passenger[]>>(
      `${this._baseEndPoint}/addRange`,
      passengers,
    );
  }

  delete(passenger: Passenger): Observable<WebApiResponse<Passenger>> {
    return this.apiService.delete<WebApiResponse<Passenger>>(
      `${this._baseEndPoint}/remove`,
      passenger,
    );
  }
}
