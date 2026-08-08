import { Injectable } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@friday/core';
import { VehicleMaintenance } from '@friday/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class VehicleMaintenanceService {
  private _baseEndPoint = ApiType.VehicleMaintenances;
  private _maintenanceChangedSubject = new BehaviorSubject<void>(undefined);
  maintenanceChanged$ = this._maintenanceChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getAll(): Observable<WebApiResponse<VehicleMaintenance[]>> {
    return this.apiService.get<WebApiResponse<VehicleMaintenance[]>>(
      `${this._baseEndPoint}/getAll`,
    );
  }

  getById(id: string): Observable<WebApiResponse<VehicleMaintenance>> {
    return this.apiService.get<WebApiResponse<VehicleMaintenance>>(
      `${this._baseEndPoint}/getById/${id}`,
    );
  }

  getByVehicle(
    vehicleId: string,
  ): Observable<WebApiResponse<VehicleMaintenance[]>> {
    return this.apiService.get<WebApiResponse<VehicleMaintenance[]>>(
      `${this._baseEndPoint}/getByVehicle/${vehicleId}`,
    );
  }

  add(
    maintenance: VehicleMaintenance,
  ): Observable<WebApiResponse<VehicleMaintenance>> {
    return this.apiService
      .post<WebApiResponse<VehicleMaintenance>>(
        `${this._baseEndPoint}/add`,
        maintenance,
      )
      .pipe(tap(() => this._maintenanceChangedSubject.next()));
  }

  update(
    maintenance: VehicleMaintenance,
  ): Observable<WebApiResponse<VehicleMaintenance>> {
    return this.apiService
      .put<WebApiResponse<VehicleMaintenance>>(
        `${this._baseEndPoint}/update`,
        maintenance,
      )
      .pipe(tap(() => this._maintenanceChangedSubject.next()));
  }

  delete(
    maintenance: VehicleMaintenance,
  ): Observable<WebApiResponse<VehicleMaintenance>> {
    return this.apiService
      .delete<WebApiResponse<VehicleMaintenance>>(
        `${this._baseEndPoint}/remove`,
        maintenance,
      )
      .pipe(tap(() => this._maintenanceChangedSubject.next()));
  }
}
