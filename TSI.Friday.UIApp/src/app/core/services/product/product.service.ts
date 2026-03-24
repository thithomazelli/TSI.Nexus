import { Injectable } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@friday/core';
import { Product } from '@friday/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private _baseEndPoint = ApiType.Products;
  private products$ = new BehaviorSubject<Product[]>([]);
  private loaded = false;
  private productChangedSubject = new BehaviorSubject<void>(undefined);

  productChanged$ = this.productChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getProducts(forceRefresh = true): Observable<Product[]> {
    if (!this.loaded || forceRefresh) {
      this.apiService
        .get<WebApiResponse<Product[]>>(`${this._baseEndPoint}/getAll`)
        .pipe(
          tap((response) => {
            this.products$.next(response.data);
            this.loaded = true;
          }),
          catchError(() => {
            this.products$.next([]);
            return of([]);
          }),
        )
        .subscribe();
    }
    return this.products$.asObservable();
  }

  add(product: Product): Observable<WebApiResponse<Product>> {
    const delayMs = 5000; // delay de 5 segundos para teste visual
    return this.apiService
      .post<WebApiResponse<Product>>(`${this._baseEndPoint}/add`, product)
      .pipe(
        delay(delayMs),
        tap(() => this.productChangedSubject.next()),
      );
  }

  update(product: Product): Observable<WebApiResponse<Product>> {
    const delayMs = 5000; // delay de 5 segundos para teste visual
    return this.apiService
      .put<WebApiResponse<Product>>(`${this._baseEndPoint}/update`, product)
      .pipe(
        delay(delayMs),
        tap(() => this.productChangedSubject.next()),
      );
  }

  refreshProducts(): void {
    this.loaded = false;
    this.getProducts(true).subscribe();
  }
}
