import { Injectable } from '@angular/core';
import { ApiType, ResponseStatus } from '../../enums';
import { OrderProduct } from '../../models';
import { ApiService, WebApiResponse } from '@friday/core';
import { BehaviorSubject, delay, Observable, of, Subject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrderProductService {
  private _baseEndPoint = ApiType.OrderProducts;
  private _orderProducts$ = new BehaviorSubject<OrderProduct[]>([]);
  private _orderProductChangedSubject = new BehaviorSubject<void>(undefined);
  private _orderProductAdded$ = new Subject<OrderProduct>();

  orderProductChanged$ = this._orderProductChangedSubject.asObservable();
  orderProductAdded$ = this._orderProductAdded$.asObservable();

  constructor(private apiService: ApiService) {}

  getAll(): Observable<WebApiResponse<OrderProduct[]>> {
    return this.apiService
      .get<WebApiResponse<OrderProduct[]>>(`${this._baseEndPoint}/getAll`)
      .pipe(
        tap((response) => {
          this._orderProducts$.next(response.data);
        }),
      );
  }

  getByEntityId(
    id: string,
    entity: string,
  ): Observable<WebApiResponse<OrderProduct[]>> {
    return this.apiService
      .get<
        WebApiResponse<OrderProduct[]>
      >(`${this._baseEndPoint}/getBy${entity}Id/${id}`)
      .pipe(
        tap((response) => {
          this._orderProducts$.next(response.data);
        }),
      );
  }

  getDelayed(): Observable<WebApiResponse<OrderProduct[]>> {
    return this.apiService.get<WebApiResponse<OrderProduct[]>>(
      `${this._baseEndPoint}/getDelayed`,
    );
  }

  add(orderProduct: OrderProduct): Observable<WebApiResponse<OrderProduct>> {
    const delayMs = 1000; // delay de 1 segundo para teste visual
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
    const delayMs = 1000; // delay de 1 segundo para teste visual
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
    return this.apiService
      .delete<
        WebApiResponse<OrderProduct>
      >(`${this._baseEndPoint}/remove`, orderProduct)
      .pipe(tap(() => this._orderProductChangedSubject.next()));
  }
}
