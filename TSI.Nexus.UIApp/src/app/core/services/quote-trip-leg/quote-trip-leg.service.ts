import { Injectable } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@nexus/core';
import { QuoteTripLeg } from '@nexus/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class QuoteTripLegService {
  private _baseEndPoint = ApiType.QuoteTripLegs;
  private _quoteTripLegChangedSubject = new BehaviorSubject<void>(undefined);
  quoteTripLegChanged$ = this._quoteTripLegChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getByQuoteTrip(quoteTripId: string): Observable<WebApiResponse<QuoteTripLeg[]>> {
    return this.apiService.get<WebApiResponse<QuoteTripLeg[]>>(
      `${this._baseEndPoint}/getByQuoteTrip/${quoteTripId}`,
    );
  }

  add(quoteTripLeg: QuoteTripLeg): Observable<WebApiResponse<QuoteTripLeg>> {
    return this.apiService
      .post<WebApiResponse<QuoteTripLeg>>(`${this._baseEndPoint}/add`, quoteTripLeg)
      .pipe(tap(() => this._quoteTripLegChangedSubject.next()));
  }

  update(quoteTripLeg: QuoteTripLeg): Observable<WebApiResponse<QuoteTripLeg>> {
    return this.apiService
      .put<WebApiResponse<QuoteTripLeg>>(`${this._baseEndPoint}/update`, quoteTripLeg)
      .pipe(tap(() => this._quoteTripLegChangedSubject.next()));
  }

  delete(quoteTripLeg: QuoteTripLeg): Observable<WebApiResponse<QuoteTripLeg>> {
    return this.apiService
      .delete<WebApiResponse<QuoteTripLeg>>(`${this._baseEndPoint}/remove`, quoteTripLeg)
      .pipe(tap(() => this._quoteTripLegChangedSubject.next()));
  }
}
