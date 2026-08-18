import { Injectable } from '@angular/core';
import { ApiType, ResponseStatus } from '../../enums';
import { QuoteProduct } from '../../models';
import { ApiService, TranslationService, WebApiResponse } from '@friday/core';
import { BehaviorSubject, Observable, of, Subject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class QuoteProductService {
  private _baseEndPoint = ApiType.QuoteProducts;
  private _quoteProducts$ = new BehaviorSubject<QuoteProduct[]>([]);
  private _quoteProductChangedSubject = new BehaviorSubject<void>(undefined);
  private _quoteProductAdded$ = new Subject<QuoteProduct>();

  quoteProductChanged$ = this._quoteProductChangedSubject.asObservable();
  quoteProductAdded$ = this._quoteProductAdded$.asObservable();

  constructor(
    private apiService: ApiService,
    private translationService: TranslationService,
  ) {}

  getAll(): Observable<WebApiResponse<QuoteProduct[]>> {
    return this.apiService
      .get<WebApiResponse<QuoteProduct[]>>(`${this._baseEndPoint}/getAll`)
      .pipe(
        tap((response) => {
          this._quoteProducts$.next(response.data);
        }),
      );
  }

  getByEntityId(
    id: string,
    entity: string,
  ): Observable<WebApiResponse<QuoteProduct[]>> {
    return this.apiService
      .get<
        WebApiResponse<QuoteProduct[]>
      >(`${this._baseEndPoint}/getBy${entity}Id/${id}`)
      .pipe(
        tap((response) => {
          this._quoteProducts$.next(response.data);
        }),
      );
  }

  getById(quoteProductId: string): Observable<WebApiResponse<QuoteProduct>> {
    return this.apiService.get<WebApiResponse<QuoteProduct>>(
      `${this._baseEndPoint}/getById/${quoteProductId}`,
    );
  }

  getDelayed(): Observable<WebApiResponse<QuoteProduct[]>> {
    return this.apiService.get<WebApiResponse<QuoteProduct[]>>(
      `${this._baseEndPoint}/getDelayed`,
    );
  }

  add(quoteProduct: QuoteProduct): Observable<WebApiResponse<QuoteProduct>> {
    return this.apiService
      .post<
        WebApiResponse<QuoteProduct>
      >(`${this._baseEndPoint}/add`, quoteProduct)
      .pipe(tap(() => this._quoteProductChangedSubject.next()));
  }

  addTemporary(
    quoteProduct: QuoteProduct,
  ): Observable<WebApiResponse<QuoteProduct>> {
    this._quoteProductAdded$.next(quoteProduct);
    return of({
      data: quoteProduct,
      message: this.translationService.instant('QUOTES.ITEM_ADDED_TEMPORARILY'),
      status: ResponseStatus.Success,
    });
  }

  update(quoteProduct: QuoteProduct): Observable<WebApiResponse<QuoteProduct>> {
    return this.apiService
      .put<
        WebApiResponse<QuoteProduct>
      >(`${this._baseEndPoint}/update`, quoteProduct)
      .pipe(tap(() => this._quoteProductChangedSubject.next()));
  }

  delete(quoteProduct: QuoteProduct): Observable<WebApiResponse<QuoteProduct>> {
    return this.apiService
      .delete<
        WebApiResponse<QuoteProduct>
      >(`${this._baseEndPoint}/remove`, quoteProduct)
      .pipe(tap(() => this._quoteProductChangedSubject.next()));
  }
}
