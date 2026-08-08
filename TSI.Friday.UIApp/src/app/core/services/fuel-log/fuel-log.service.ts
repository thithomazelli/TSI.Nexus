import { Injectable } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@friday/core';
import { FuelLog } from '@friday/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FuelLogService {
  private _baseEndPoint = ApiType.FuelLogs;

  constructor(private apiService: ApiService) {}

  getByVehicle(vehicleId: string): Observable<WebApiResponse<FuelLog[]>> {
    return this.apiService.get<WebApiResponse<FuelLog[]>>(
      `${this._baseEndPoint}/getByVehicle/${vehicleId}`,
    );
  }

  add(fuelLog: FuelLog): Observable<WebApiResponse<FuelLog>> {
    return this.apiService.post<WebApiResponse<FuelLog>>(
      `${this._baseEndPoint}/add`,
      fuelLog,
    );
  }

  update(fuelLog: FuelLog): Observable<WebApiResponse<FuelLog>> {
    return this.apiService.put<WebApiResponse<FuelLog>>(
      `${this._baseEndPoint}/update`,
      fuelLog,
    );
  }

  delete(fuelLog: FuelLog): Observable<WebApiResponse<FuelLog>> {
    return this.apiService.delete<WebApiResponse<FuelLog>>(
      `${this._baseEndPoint}/remove`,
      fuelLog,
    );
  }
}
