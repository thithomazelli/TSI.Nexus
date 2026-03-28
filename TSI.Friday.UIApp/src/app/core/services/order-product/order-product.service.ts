import { Injectable } from '@angular/core';
import { BehaviorSubject, delay, Observable, of, Subject, tap } from 'rxjs';
import { ApiType, ResponseStatus } from '../../enums';
import { OrderProduct } from '../../models';
import { ApiService, WebApiResponse } from '@friday/core';

@Injectable({
  providedIn: 'root',
})
export class OrderProductService {
  private _baseEndPoint = ApiType.OrderProducts;
  private _orderProducts$ = new BehaviorSubject<OrderProduct[]>([]);
  private _loaded = false;

  private _orderProductChangedSubject = new BehaviorSubject<void>(undefined);
  private _orderProductAdded$ = new Subject<OrderProduct>();

  orderProductChanged$ = this._orderProductChangedSubject.asObservable();
  orderProductAdded$ = this._orderProductAdded$.asObservable();

  constructor(private apiService: ApiService) {}

  getAll(forceRefresh = true): Observable<WebApiResponse<OrderProduct[]>> {
    if (!this._loaded || forceRefresh) {
      return this.apiService
        .get<WebApiResponse<OrderProduct[]>>(`${this._baseEndPoint}/getAll`)
        .pipe(
          tap((response) => {
            this._orderProducts$.next(response.data);
            this._loaded = true;
          }),
        );
    }
    return of({
      data: this._orderProducts$.value,
      message: 'Itens de pedido carregados do cache',
      status: ResponseStatus.Success,
    });
  }

  getByProductId(
    productId: string,
    forceRefresh = true,
  ): Observable<WebApiResponse<OrderProduct[]>> {
    if (!this._loaded || forceRefresh) {
      return this.apiService
        .get<
          WebApiResponse<OrderProduct[]>
        >(`${this._baseEndPoint}/getByProductId/${productId}`)
        .pipe(
          tap((response) => {
            this._orderProducts$.next(response.data);
            this._loaded = true;
          }),
        );
    }
    return of({
      data: this._orderProducts$.value,
      message: 'Itens de pedido carregados do cache',
      status: ResponseStatus.Success,
    });
  }

  getByOrderId(
    orderId: string,
    forceRefresh = true,
  ): Observable<WebApiResponse<OrderProduct[]>> {
    if (!this._loaded || forceRefresh) {
      return this.apiService
        .get<
          WebApiResponse<OrderProduct[]>
        >(`${this._baseEndPoint}/getByOrderId/${orderId}`)
        .pipe(
          tap((response) => {
            this._orderProducts$.next(response.data);
            this._loaded = true;
          }),
        );
    }
    return of({
      data: this._orderProducts$.value,
      message: 'Itens de pedido carregados do cache',
      status: ResponseStatus.Success,
    });
  }

  getDelayed(): Observable<WebApiResponse<OrderProduct[]>> {
    return this.apiService.get<WebApiResponse<OrderProduct[]>>(
      `${this._baseEndPoint}/getDelayed`,
    );
  }

  add(orderProduct: OrderProduct): Observable<WebApiResponse<OrderProduct>> {
    const delayMs = 3000; // delay de 5 segundos para teste visual
    return this.apiService
      .post<
        WebApiResponse<OrderProduct>
      >(`${this._baseEndPoint}/add`, orderProduct)
      .pipe(
        delay(delayMs),
        tap(() => this._orderProductChangedSubject.next()),
      );
  }

  addTemporary(
    orderProduct: OrderProduct,
  ): Observable<WebApiResponse<OrderProduct>> {
    this._orderProductAdded$.next(orderProduct);
    return of({
      data: orderProduct,
      message: 'Item de pedido adicionado temporariamente',
      status: ResponseStatus.Success,
    });
  }

  update(orderProduct: OrderProduct): Observable<WebApiResponse<OrderProduct>> {
    const delayMs = 3000; // delay de 5 segundos para teste visual
    return this.apiService
      .put<
        WebApiResponse<OrderProduct>
      >(`${this._baseEndPoint}/update`, orderProduct)
      .pipe(
        delay(delayMs),
        tap(() => this._orderProductChangedSubject.next()),
      );
  }

  delete(orderProduct: OrderProduct): Observable<WebApiResponse<OrderProduct>> {
    return this.apiService.delete<WebApiResponse<OrderProduct>>(
      `${this._baseEndPoint}/remove`,
      orderProduct,
    );
  }
}
