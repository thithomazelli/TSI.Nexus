import { Injectable } from '@angular/core';
import {
  Address,
  ApiService,
  ApiType,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';
import { BehaviorSubject, delay, Observable, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private _baseEndPoint = ApiType.Addresses;
  private _addresses$ = new BehaviorSubject<Address[]>([]);
  private _loaded = false;

  private _addressChangedSubject = new BehaviorSubject<void>(undefined);
  addressChanged$ = this._addressChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getAddresses(
    parentId: string,
    forceRefresh = true,
  ): Observable<WebApiResponse<Address[]>> {
    if (!this._loaded || forceRefresh) {
      return this.apiService
        .get<
          WebApiResponse<Address[]>
        >(`${this._baseEndPoint}/getAllByBusinessPartnerId/${parentId}`)
        .pipe(
          tap((response) => {
            this._addresses$.next(response.data);
            this._loaded = true;
          }),
        );
    }
    return of({
      data: this._addresses$.value,
      message: 'Endereços carregados do cache',
      status: ResponseStatus.Success,
    });
  }

  refresh(parentId: string): Observable<WebApiResponse<Address[]>> {
    this._loaded = false;
    return this.getAddresses(parentId, true);
  }

  add(address: Address): Observable<WebApiResponse<Address>> {
    const delayMs = 5000; // delay de 5 segundos para teste visual
    return this.apiService
      .post<WebApiResponse<Address>>(`${this._baseEndPoint}/add`, address)
      .pipe(
        delay(delayMs),
        tap(() => this._addressChangedSubject.next()),
      );
  }

  update(address: Address): Observable<WebApiResponse<Address>> {
    const delayMs = 5000; // delay de 5 segundos para teste visual
    return this.apiService
      .put<WebApiResponse<Address>>(`${this._baseEndPoint}/update`, address)
      .pipe(
        delay(delayMs),
        tap(() => this._addressChangedSubject.next()),
      );
  }

  deleteAddress(address: Address): Observable<WebApiResponse<Address>> {
    return this.apiService.delete<WebApiResponse<Address>>(
      `${this._baseEndPoint}/remove`,
      address,
    );
  }
}
