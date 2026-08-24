import { Injectable } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@nexus/core';
import { Vehicle } from '@nexus/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private _baseEndPoint = ApiType.Vehicles;
  private _vehicleChangedSubject = new BehaviorSubject<void>(undefined);
  vehicleChanged$ = this._vehicleChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getAll(): Observable<WebApiResponse<Vehicle[]>> {
    return this.apiService.get<WebApiResponse<Vehicle[]>>(
      `${this._baseEndPoint}/getAll`,
    );
  }

  getById(id: string): Observable<WebApiResponse<Vehicle>> {
    return this.apiService.get<WebApiResponse<Vehicle>>(
      `${this._baseEndPoint}/getById/${id}`,
    );
  }

  getAvailable(): Observable<WebApiResponse<Vehicle[]>> {
    return this.apiService.get<WebApiResponse<Vehicle[]>>(
      `${this._baseEndPoint}/getAvailable`,
    );
  }

  refresh(): Observable<WebApiResponse<Vehicle[]>> {
    return this.getAll();
  }

  add(vehicle: Vehicle): Observable<WebApiResponse<Vehicle>> {
    return this.apiService
      .post<WebApiResponse<Vehicle>>(`${this._baseEndPoint}/add`, vehicle)
      .pipe(tap(() => this._vehicleChangedSubject.next()));
  }

  update(vehicle: Vehicle): Observable<WebApiResponse<Vehicle>> {
    return this.apiService
      .put<WebApiResponse<Vehicle>>(`${this._baseEndPoint}/update`, vehicle)
      .pipe(tap(() => this._vehicleChangedSubject.next()));
  }

  delete(vehicle: Vehicle): Observable<WebApiResponse<Vehicle>> {
    return this.apiService
      .delete<WebApiResponse<Vehicle>>(`${this._baseEndPoint}/remove`, vehicle)
      .pipe(tap(() => this._vehicleChangedSubject.next()));
  }
}
