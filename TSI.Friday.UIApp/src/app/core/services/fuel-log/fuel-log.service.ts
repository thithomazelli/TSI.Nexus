import { Injectable } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@friday/core';
import { FuelLog } from '@friday/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class FuelLogService {
  private _baseEndPoint = ApiType.FuelLogs;
  private _fuelLogChangedSubject = new BehaviorSubject<void>(undefined);
  fuelLogChanged$ = this._fuelLogChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getByVehicle(vehicleId: string): Observable<WebApiResponse<FuelLog[]>> {
    return this.apiService.get<WebApiResponse<FuelLog[]>>(
      `${this._baseEndPoint}/getByVehicle/${vehicleId}`,
    );
  }

  add(fuelLog: FuelLog): Observable<WebApiResponse<FuelLog>> {
    return this.apiService
      .post<WebApiResponse<FuelLog>>(`${this._baseEndPoint}/add`, fuelLog)
      .pipe(tap(() => this._fuelLogChangedSubject.next()));
  }

  update(fuelLog: FuelLog): Observable<WebApiResponse<FuelLog>> {
    return this.apiService
      .put<WebApiResponse<FuelLog>>(`${this._baseEndPoint}/update`, fuelLog)
      .pipe(tap(() => this._fuelLogChangedSubject.next()));
  }

  delete(fuelLog: FuelLog): Observable<WebApiResponse<FuelLog>> {
    return this.apiService
      .delete<WebApiResponse<FuelLog>>(`${this._baseEndPoint}/remove`, fuelLog)
      .pipe(tap(() => this._fuelLogChangedSubject.next()));
  }
}
