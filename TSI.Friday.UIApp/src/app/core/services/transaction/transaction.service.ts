import { Injectable } from '@angular/core';
import { ApiType } from '../../enums';
import { BehaviorSubject, delay, Observable, tap } from 'rxjs';
import { Transaction } from '../../models';
import { ApiService, WebApiResponse } from '@friday/core';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private _baseEndPoint = ApiType.Transactions;
  private _transactions$ = new BehaviorSubject<Transaction[]>([]);
  private _transactionChangedSubject = new BehaviorSubject<void>(undefined);
  transactionChanged$ = this._transactionChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getAll(): Observable<WebApiResponse<Transaction[]>> {
    return this.apiService
      .get<WebApiResponse<Transaction[]>>(`${this._baseEndPoint}/getAll`)
      .pipe(
        tap((response) => {
          this._transactions$.next(response.data);
        }),
      );
  }

  getById(transactionId: string): Observable<WebApiResponse<Transaction>> {
    return this.apiService.get<WebApiResponse<Transaction>>(
      `${this._baseEndPoint}/getById/${transactionId}`,
    );
  }

  getByBusinessPartnerId(
    businessPartnerId: string,
  ): Observable<WebApiResponse<Transaction[]>> {
    return this.apiService
      .get<
        WebApiResponse<Transaction[]>
      >(`${this._baseEndPoint}/getByBusinessPartnerId/${businessPartnerId}`)
      .pipe(
        tap((response) => {
          this._transactions$.next(response.data);
        }),
      );
  }

  refreshTransactions(): Observable<WebApiResponse<Transaction[]>> {
    return this.getAll();
  }

  add(transaction: Transaction): Observable<WebApiResponse<Transaction>> {
    const delayMs = 1000; // delay de 1 segundo para teste visual
    return this.apiService
      .post<
        WebApiResponse<Transaction>
      >(`${this._baseEndPoint}/add`, transaction)
      .pipe(
        delay(delayMs),
        tap(() => this._transactionChangedSubject.next()),
      );
  }

  update(transaction: Transaction): Observable<WebApiResponse<Transaction>> {
    const delayMs = 1000; // delay de 1 segundo para teste visual
    return this.apiService
      .put<
        WebApiResponse<Transaction>
      >(`${this._baseEndPoint}/update`, transaction)
      .pipe(
        delay(delayMs),
        tap(() => this._transactionChangedSubject.next()),
      );
  }

  delete(transaction: Transaction): Observable<WebApiResponse<Transaction>> {
    return this.apiService
      .delete<
        WebApiResponse<Transaction>
      >(`${this._baseEndPoint}/remove`, transaction)
      .pipe(tap(() => this._transactionChangedSubject.next()));
  }
}
