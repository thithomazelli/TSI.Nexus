import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiService, ApiType, WebApiResponse, Order } from '@friday/core';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private orders$ = new BehaviorSubject<Order[]>([]);
  private loaded = false;
  private _baseEndPoint = ApiType.Orders;

  constructor(private apiService: ApiService) {}

  getOrders(forceRefresh = false): Observable<Order[]> {
    if (!this.loaded || forceRefresh) {
      this.apiService
        .get<WebApiResponse<Order[]>>(`${this._baseEndPoint}/getAll`)
        .pipe(
          tap((response) => {
            this.orders$.next(response.data);
            this.loaded = true;
          }),
          catchError(() => {
            this.orders$.next([]);
            return of([]);
          }),
        )
        .subscribe();
    }
    return this.orders$.asObservable();
  }

  refreshOrders(): void {
    this.loaded = false;
    this.getOrders(true).subscribe();
  }

  addOrUpdateOrder(order: Order): void {
    const current = this.orders$.value;
    const idx = current.findIndex((o) => o.id === order.id);
    if (idx > -1) {
      current[idx] = order;
    } else {
      current.push(order);
    }
    this.orders$.next([...current]);
  }
}
