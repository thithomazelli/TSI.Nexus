import { Injectable } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@friday/core';
import { Driver } from '@friday/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DriverService {
  private _baseEndPoint = ApiType.Drivers;
  private _driverChangedSubject = new BehaviorSubject<void>(undefined);
  driverChanged$ = this._driverChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getAll(): Observable<WebApiResponse<Driver[]>> {
    return this.apiService.get<WebApiResponse<Driver[]>>(
      `${this._baseEndPoint}/getAll`,
    );
  }

  getById(id: string): Observable<WebApiResponse<Driver>> {
    return this.apiService.get<WebApiResponse<Driver>>(
      `${this._baseEndPoint}/getById/${id}`,
    );
  }

  getActive(): Observable<WebApiResponse<Driver[]>> {
    return this.apiService.get<WebApiResponse<Driver[]>>(
      `${this._baseEndPoint}/getActive`,
    );
  }

  getExpiringLicenses(daysAhead = 60): Observable<WebApiResponse<Driver[]>> {
    return this.apiService.get<WebApiResponse<Driver[]>>(
      `${this._baseEndPoint}/getExpiringLicenses?daysAhead=${daysAhead}`,
    );
  }

  refresh(): Observable<WebApiResponse<Driver[]>> {
    return this.getAll();
  }

  add(driver: Driver): Observable<WebApiResponse<Driver>> {
    return this.apiService
      .post<WebApiResponse<Driver>>(`${this._baseEndPoint}/add`, driver)
      .pipe(tap(() => this._driverChangedSubject.next()));
  }

  update(driver: Driver): Observable<WebApiResponse<Driver>> {
    return this.apiService
      .put<WebApiResponse<Driver>>(`${this._baseEndPoint}/update`, driver)
      .pipe(tap(() => this._driverChangedSubject.next()));
  }

  delete(driver: Driver): Observable<WebApiResponse<Driver>> {
    return this.apiService
      .delete<WebApiResponse<Driver>>(`${this._baseEndPoint}/remove`, driver)
      .pipe(tap(() => this._driverChangedSubject.next()));
  }
}
