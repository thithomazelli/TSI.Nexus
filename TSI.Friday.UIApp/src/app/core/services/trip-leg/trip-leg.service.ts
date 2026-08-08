import { Injectable } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@friday/core';
import { TripLeg } from '@friday/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TripLegService {
  private _baseEndPoint = ApiType.TripLegs;

  constructor(private apiService: ApiService) {}

  getByOrder(orderId: string): Observable<WebApiResponse<TripLeg[]>> {
    return this.apiService.get<WebApiResponse<TripLeg[]>>(
      `${this._baseEndPoint}/getByOrder/${orderId}`,
    );
  }

  add(tripLeg: TripLeg): Observable<WebApiResponse<TripLeg>> {
    return this.apiService.post<WebApiResponse<TripLeg>>(
      `${this._baseEndPoint}/add`,
      tripLeg,
    );
  }

  update(tripLeg: TripLeg): Observable<WebApiResponse<TripLeg>> {
    return this.apiService.put<WebApiResponse<TripLeg>>(
      `${this._baseEndPoint}/update`,
      tripLeg,
    );
  }

  delete(tripLeg: TripLeg): Observable<WebApiResponse<TripLeg>> {
    return this.apiService.delete<WebApiResponse<TripLeg>>(
      `${this._baseEndPoint}/remove`,
      tripLeg,
    );
  }
}
