import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import {
  ApiService,
  ApiType,
  BusinessPartner,
  WebApiResponse,
} from '@friday/core';

@Injectable({ providedIn: 'root' })
export class BusinessPartnerService {
  private businessPartners$ = new BehaviorSubject<BusinessPartner[]>([]);
  private loaded = false;
  private _baseEndPoint = ApiType.BusinessPartners;

  constructor(private apiService: ApiService) {}

  getClients(forceRefresh = false): Observable<BusinessPartner[]> {
    if (!this.loaded || forceRefresh) {
      this.apiService
        .get<WebApiResponse<BusinessPartner[]>>(
          `${this._baseEndPoint}/getAllClients`,
        )
        .pipe(
          tap((response) => {
            this.businessPartners$.next(response.data);
            this.loaded = true;
          }),
          catchError(() => {
            this.businessPartners$.next([]);
            return of([]);
          }),
        )
        .subscribe();
    }
    return this.businessPartners$.asObservable();
  }

  refreshBusinessPartners(): void {
    this.loaded = false;
    this.getClients(true).subscribe();
  }

  addOrUpdateBusinessPartner(businessPartner: BusinessPartner): void {
    const current = this.businessPartners$.value;
    const idx = current.findIndex((c) => c.id === businessPartner.id);
    if (idx > -1) {
      current[idx] = businessPartner;
    } else {
      current.push(businessPartner);
    }
    this.businessPartners$.next([...current]);
  }
}
