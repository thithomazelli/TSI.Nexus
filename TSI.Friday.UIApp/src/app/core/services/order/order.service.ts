import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import {
  ApiService,
  ApiType,
  WebApiResponse,
  Order,
  ResponseStatus,
} from '@friday/core';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private _baseEndPoint = ApiType.Orders;
  private _orders$ = new BehaviorSubject<Order[]>([]);
  private _loaded = false;

  private _orderChangedSubject = new BehaviorSubject<void>(undefined);
  orderChanged$ = this._orderChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getAll(): Observable<WebApiResponse<Order[]>> {
    return this.apiService
      .get<WebApiResponse<Order[]>>(`${this._baseEndPoint}/getAll`)
      .pipe(
        tap((response) => {
          this._orders$.next(response.data);
          this._loaded = true;
        }),
      );
  }

  getById(orderId: string): Observable<WebApiResponse<Order>> {
    this._loaded = true;
    return this.apiService.get<WebApiResponse<Order>>(
      `${ApiType.Orders}/getById/${orderId}`,
    );
  }

  getByBusinessPartnerId(
    businessPartnerId: string,
  ): Observable<WebApiResponse<Order[]>> {
    return this.apiService
      .get<
        WebApiResponse<Order[]>
      >(`${this._baseEndPoint}/getByBusinessPartnerId/${businessPartnerId}`)
      .pipe(
        tap((response) => {
          this._orders$.next(response.data);
          this._loaded = true;
        }),
      );
  }

  refreshOrders(): Observable<WebApiResponse<Order[]>> {
    this._loaded = false;
    return this.getAll();
  }

  add(order: Order): Observable<WebApiResponse<Order>> {
    const delayMs = 1000; // delay de 1 segundo para teste visual
    return this.apiService
      .post<WebApiResponse<Order>>(`${this._baseEndPoint}/add`, order)
      .pipe(
        delay(delayMs),
        tap(() => this._orderChangedSubject.next()),
      );
  }

  update(order: Order): Observable<WebApiResponse<Order>> {
    const delayMs = 1000; // delay de 1 segundo para teste visual
    return this.apiService
      .put<WebApiResponse<Order>>(`${this._baseEndPoint}/update`, order)
      .pipe(
        delay(delayMs),
        tap(() => this._orderChangedSubject.next()),
      );
  }

  delete(order: Order): Observable<WebApiResponse<Order>> {
    return this.apiService
      .delete<WebApiResponse<Order>>(`${this._baseEndPoint}/remove`, order)
      .pipe(tap(() => this._orderChangedSubject.next()));
  }
}
