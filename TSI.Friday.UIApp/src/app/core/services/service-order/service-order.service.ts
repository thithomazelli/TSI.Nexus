import { Injectable } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@friday/core';
import { ServiceOrder } from '@friday/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServiceOrderService {
  private _baseEndPoint = ApiType.ServiceOrders;

  constructor(private apiService: ApiService) {}

  getByDriver(driverId: string): Observable<WebApiResponse<ServiceOrder[]>> {
    return this.apiService.get<WebApiResponse<ServiceOrder[]>>(
      `${this._baseEndPoint}/getByDriver/${driverId}`,
    );
  }
}
