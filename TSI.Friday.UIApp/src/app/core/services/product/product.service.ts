import { Injectable } from '@angular/core';
import { ApiService, ApiType, ProductType, WebApiResponse } from '@friday/core';
import { Product } from '@friday/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private products$ = new BehaviorSubject<Product[]>([]);
  private loaded = false;
  private _baseEndPoint = ApiType.Products;

  constructor(private apiService: ApiService) {}

  getProducts(forceRefresh = true): Observable<Product[]> {
    if (!this.loaded || forceRefresh) {
      this.apiService
        .get<WebApiResponse<Product[]>>(`${this._baseEndPoint}/getAll`)
        .pipe(
          tap((response) => {
            response.data = response.data.filter(
              (p) =>
                (p.type !== ProductType.Service && p.quantityInStock > 0) ||
                p.type === ProductType.Service,
            );
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

  refreshProducts(): void {
    this.loaded = false;
    this.getProducts(true).subscribe();
  }

  addOrUpdateProduct(product: Product): void {
    const current = this.products$.value;
    const idx = current.findIndex((c) => c.id === product.id);
    if (idx > -1) {
      current[idx] = product;
    } else {
      current.push(product);
    }
    this.products$.next([...current]);
  }
}
