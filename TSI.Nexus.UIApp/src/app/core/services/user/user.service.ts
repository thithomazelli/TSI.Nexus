import { Injectable } from '@angular/core';
import { ApiType } from '../../enums';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { User } from '../../models';
import { WebApiResponse } from '../../utilities';
import { ApiService } from '@nexus/core';
import { shareReplay, startWith, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _baseEndPoint = ApiType.Users;
  private _refresh$ = new Subject<void>();
  private _userChangedSubject = new BehaviorSubject<void>(undefined);
  userChanged$ = this._userChangedSubject.asObservable();

  // Shared stream behind getAll() - same shareReplay(1) pattern already used by
  // FeatureFlagService/ProductService, so multiple consumers share one fetch instead of each
  // firing its own GET.
  readonly users$: Observable<WebApiResponse<User[]>> = this._refresh$.pipe(
    startWith(undefined),
    switchMap(() => this.apiService.get<WebApiResponse<User[]>>(`${this._baseEndPoint}/getAll`)),
    shareReplay(1),
  );

  constructor(private apiService: ApiService) {}

  getAll(): Observable<WebApiResponse<User[]>> {
    return this.users$;
  }

  getById(id: string): Observable<WebApiResponse<User>> {
    return this.apiService.get<WebApiResponse<User>>(
      `${this._baseEndPoint}/getById/${id}`,
    );
  }

  refresh(): void {
    this._refresh$.next();
  }

  add(user: User): Observable<WebApiResponse<User>> {
    return this.apiService
      .post<WebApiResponse<User>>(`${this._baseEndPoint}/add`, user)
      .pipe(
        tap(() => {
          this.refresh();
          this._userChangedSubject.next();
        }),
      );
  }

  update(user: User): Observable<WebApiResponse<User>> {
    return this.apiService
      .put<WebApiResponse<User>>(`${this._baseEndPoint}/update`, user)
      .pipe(
        tap(() => {
          this.refresh();
          this._userChangedSubject.next();
        }),
      );
  }

  delete(user: User): Observable<WebApiResponse<User>> {
    return this.apiService
      .delete<WebApiResponse<User>>(`${this._baseEndPoint}/remove`, user)
      .pipe(
        tap(() => {
          this.refresh();
          this._userChangedSubject.next();
        }),
      );
  }
}
