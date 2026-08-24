import { Injectable } from '@angular/core';
import { ApiType } from '../../enums';
import { VehicleMaintenanceProduct } from '../../models';
import { ApiService, WebApiResponse } from '@nexus/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VehicleMaintenanceProductService {
  private _baseEndPoint = ApiType.VehicleMaintenanceProducts;
  private _vehicleMaintenanceProductChangedSubject = new BehaviorSubject<void>(undefined);

  vehicleMaintenanceProductChanged$ = this._vehicleMaintenanceProductChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getByEntityId(
    id: string,
    entity: string,
  ): Observable<WebApiResponse<VehicleMaintenanceProduct[]>> {
    return this.apiService.get<
      WebApiResponse<VehicleMaintenanceProduct[]>
    >(`${this._baseEndPoint}/getBy${entity}Id/${id}`);
  }

  add(
    vehicleMaintenanceProduct: VehicleMaintenanceProduct,
  ): Observable<WebApiResponse<VehicleMaintenanceProduct>> {
    return this.apiService
      .post<
        WebApiResponse<VehicleMaintenanceProduct>
      >(`${this._baseEndPoint}/add`, vehicleMaintenanceProduct)
      .pipe(tap(() => this._vehicleMaintenanceProductChangedSubject.next()));
  }

  update(
    vehicleMaintenanceProduct: VehicleMaintenanceProduct,
  ): Observable<WebApiResponse<VehicleMaintenanceProduct>> {
    return this.apiService
      .put<
        WebApiResponse<VehicleMaintenanceProduct>
      >(`${this._baseEndPoint}/update`, vehicleMaintenanceProduct)
      .pipe(tap(() => this._vehicleMaintenanceProductChangedSubject.next()));
  }

  delete(
    vehicleMaintenanceProduct: VehicleMaintenanceProduct,
  ): Observable<WebApiResponse<VehicleMaintenanceProduct>> {
    return this.apiService
      .delete<
        WebApiResponse<VehicleMaintenanceProduct>
      >(`${this._baseEndPoint}/remove`, vehicleMaintenanceProduct)
      .pipe(tap(() => this._vehicleMaintenanceProductChangedSubject.next()));
  }
}
