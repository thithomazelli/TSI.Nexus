import { Injectable } from '@angular/core';
import {
  ApiService,
  ApiType,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';
import { Product } from '@friday/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private _baseEndPoint = ApiType.Products;
  private _products$ = new BehaviorSubject<Product[]>([]);
  private _loaded = false;

  private _productChangedSubject = new BehaviorSubject<void>(undefined);
  productChanged$ = this._productChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getProducts(forceRefresh = true): Observable<WebApiResponse<Product[]>> {
    if (!this._loaded || forceRefresh) {
      return this.apiService
        .get<WebApiResponse<Product[]>>(`${this._baseEndPoint}/getAll`)
        .pipe(
          tap((response) => {
            this._products$.next(response.data);
            this._loaded = true;
          }),
        );
    }
    return of({
      data: this._products$.value,
      message: 'Produtos carregados do cache',
      status: ResponseStatus.Success,
    });
  }

  getById(id: string): Observable<WebApiResponse<Product>> {
    this._loaded = true;
    return this.apiService
      .get<WebApiResponse<Product>>(`${this._baseEndPoint}/getById/${id}`)
      .pipe(
        tap(() => {
          this._loaded = true;
        }),
      );
  }

  refresh(): Observable<WebApiResponse<Product[]>> {
    this._loaded = false;
    return this.getProducts(true);
  }

  add(product: Product): Observable<WebApiResponse<Product>> {
    const delayMs = 1000; // delay de 1 segundo para teste visual
    return this.apiService
      .post<WebApiResponse<Product>>(`${this._baseEndPoint}/add`, product)
      .pipe(
        delay(delayMs),
        tap(() => this._productChangedSubject.next()),
      );
  }

  update(product: Product): Observable<WebApiResponse<Product>> {
    const delayMs = 1000; // delay de 1 segundo para teste visual
    return this.apiService
      .put<WebApiResponse<Product>>(`${this._baseEndPoint}/update`, product)
      .pipe(
        delay(delayMs),
        tap(() => this._productChangedSubject.next()),
      );
  }

  delete(product: Product): Observable<WebApiResponse<Product>> {
    return this.apiService.delete<WebApiResponse<Product>>(
      `${this._baseEndPoint}/remove`,
      product,
    );
  }
}
