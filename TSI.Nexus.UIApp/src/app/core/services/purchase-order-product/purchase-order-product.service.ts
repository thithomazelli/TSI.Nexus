import { Injectable } from '@angular/core';
import { ApiType, ResponseStatus } from '../../enums';
import { PurchaseOrderProduct } from '../../models';
import { ApiService, WebApiResponse } from '@nexus/core';
import { BehaviorSubject, Observable, of, Subject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PurchaseOrderProductService {
  private _baseEndPoint = ApiType.PurchaseOrderProducts;
  private _purchaseOrderProducts$ = new BehaviorSubject<PurchaseOrderProduct[]>([]);
  private _purchaseOrderProductChangedSubject = new BehaviorSubject<void>(undefined);
  private _purchaseOrderProductAdded$ = new Subject<PurchaseOrderProduct>();

  purchaseOrderProductChanged$ = this._purchaseOrderProductChangedSubject.asObservable();
  purchaseOrderProductAdded$ = this._purchaseOrderProductAdded$.asObservable();

  constructor(private apiService: ApiService) {}

  getAll(): Observable<WebApiResponse<PurchaseOrderProduct[]>> {
    return this.apiService
      .get<
        WebApiResponse<PurchaseOrderProduct[]>
      >(`${this._baseEndPoint}/getAll`)
      .pipe(
        tap((response) => {
          this._purchaseOrderProducts$.next(response.data);
        }),
      );
  }

  getByEntityId(
    id: string,
    entity: string,
  ): Observable<WebApiResponse<PurchaseOrderProduct[]>> {
    return this.apiService
      .get<
        WebApiResponse<PurchaseOrderProduct[]>
      >(`${this._baseEndPoint}/getBy${entity}Id/${id}`)
      .pipe(
        tap((response) => {
          this._purchaseOrderProducts$.next(response.data);
        }),
      );
  }

  add(
    purchaseOrderProduct: PurchaseOrderProduct,
  ): Observable<WebApiResponse<PurchaseOrderProduct>> {
    return this.apiService
      .post<
        WebApiResponse<PurchaseOrderProduct>
      >(`${this._baseEndPoint}/add`, purchaseOrderProduct)
      .pipe(tap(() => this._purchaseOrderProductChangedSubject.next()));
  }

  addTemporary(
    purchaseOrderProduct: PurchaseOrderProduct,
  ): Observable<WebApiResponse<PurchaseOrderProduct>> {
    this._purchaseOrderProductAdded$.next(purchaseOrderProduct);
    return of({
      data: purchaseOrderProduct,
      message: 'Item de pedido adicionado temporariamente',
      status: ResponseStatus.Success,
    });
  }

  update(
    purchaseOrderProduct: PurchaseOrderProduct,
  ): Observable<WebApiResponse<PurchaseOrderProduct>> {
    return this.apiService
      .put<
        WebApiResponse<PurchaseOrderProduct>
      >(`${this._baseEndPoint}/update`, purchaseOrderProduct)
      .pipe(tap(() => this._purchaseOrderProductChangedSubject.next()));
  }

  delete(
    purchaseOrderProduct: PurchaseOrderProduct,
  ): Observable<WebApiResponse<PurchaseOrderProduct>> {
    return this.apiService
      .delete<
        WebApiResponse<PurchaseOrderProduct>
      >(`${this._baseEndPoint}/remove`, purchaseOrderProduct)
      .pipe(tap(() => this._purchaseOrderProductChangedSubject.next()));
  }
}
