import { Injectable } from '@angular/core';
import { ApiService, ApiType, WebApiResponse } from '@friday/core';
import { Product } from '@friday/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private _baseEndPoint = ApiType.Products;
  private _products$ = new BehaviorSubject<Product[]>([]);
  private _productChangedSubject = new BehaviorSubject<void>(undefined);
  productChanged$ = this._productChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getAll(): Observable<WebApiResponse<Product[]>> {
    return this.apiService
      .get<WebApiResponse<Product[]>>(`${this._baseEndPoint}/getAll`)
      .pipe(
        tap((response) => {
          this._products$.next(response.data);
        }),
      );
  }

  getById(id: string): Observable<WebApiResponse<Product>> {
    return this.apiService.get<WebApiResponse<Product>>(
      `${this._baseEndPoint}/getById/${id}`,
    );
  }

  refresh(): Observable<WebApiResponse<Product[]>> {
    return this.getAll();
  }

  add(product: Product): Observable<WebApiResponse<Product>> {
    return this.apiService
      .post<WebApiResponse<Product>>(`${this._baseEndPoint}/add`, product)
      .pipe(tap(() => this._productChangedSubject.next()));
  }

  update(product: Product): Observable<WebApiResponse<Product>> {
    return this.apiService
      .put<WebApiResponse<Product>>(`${this._baseEndPoint}/update`, product)
      .pipe(tap(() => this._productChangedSubject.next()));
  }

  delete(product: Product): Observable<WebApiResponse<Product>> {
    return this.apiService
      .delete<WebApiResponse<Product>>(`${this._baseEndPoint}/remove`, product)
      .pipe(tap(() => this._productChangedSubject.next()));
  }
}
