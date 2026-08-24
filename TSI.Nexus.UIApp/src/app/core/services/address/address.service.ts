import { Injectable } from '@angular/core';
import { Address, ApiService, ApiType, WebApiResponse } from '@nexus/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private _baseEndPoint = ApiType.Addresses;
  private _addresses$ = new BehaviorSubject<Address[]>([]);
  private _addressChangedSubject = new BehaviorSubject<void>(undefined);
  addressChanged$ = this._addressChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getAllByBusinessPartnerId(
    businessPartnerId: string,
  ): Observable<WebApiResponse<Address[]>> {
    return this.apiService
      .get<
        WebApiResponse<Address[]>
      >(`${this._baseEndPoint}/getAllByBusinessPartnerId/${businessPartnerId}`)
      .pipe(
        tap((response) => {
          this._addresses$.next(response.data);
        }),
      );
  }

  refresh(parentId: string): Observable<WebApiResponse<Address[]>> {
    return this.getAllByBusinessPartnerId(parentId);
  }

  add(address: Address): Observable<WebApiResponse<Address>> {
    return this.apiService
      .post<WebApiResponse<Address>>(`${this._baseEndPoint}/add`, address)
      .pipe(tap(() => this._addressChangedSubject.next()));
  }

  update(address: Address): Observable<WebApiResponse<Address>> {
    return this.apiService
      .put<WebApiResponse<Address>>(`${this._baseEndPoint}/update`, address)
      .pipe(tap(() => this._addressChangedSubject.next()));
  }

  delete(address: Address): Observable<WebApiResponse<Address>> {
    return this.apiService
      .delete<WebApiResponse<Address>>(`${this._baseEndPoint}/remove`, address)
      .pipe(tap(() => this._addressChangedSubject.next()));
  }
}
