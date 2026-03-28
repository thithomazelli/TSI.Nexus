import { Injectable } from '@angular/core';
import { ApiType, ResponseStatus } from '../../enums';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from '../../models';
import { WebApiResponse } from '../../utilities';
import { ApiService } from '@friday/core';
import { tap, delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _baseEndPoint = ApiType.Users;
  private _users$ = new BehaviorSubject<User[]>([]);
  private _loaded = false;

  private _userChangedSubject = new BehaviorSubject<void>(undefined);
  userChanged$ = this._userChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  refresh(): Observable<WebApiResponse<User[]>> {
    this._loaded = false;
    return this.getUsers$(true);
  }

  getUsers$(forceRefresh = true): Observable<WebApiResponse<User[]>> {
    if (!this._loaded || forceRefresh) {
      return this.apiService
        .get<WebApiResponse<User[]>>(`${this._baseEndPoint}/getAll`)
        .pipe(
          tap((response) => {
            this._users$.next(response.data);
            this._loaded = true;
          }),
        );
    }
    return of({
      data: this._users$.value,
      message: 'Usuários carregados do cache',
      status: ResponseStatus.Success,
    });
  }

  getById(id: string): Observable<WebApiResponse<User>> {
    this._loaded = true;
    return this.apiService
      .get<WebApiResponse<User>>(`${this._baseEndPoint}/getById/${id}`)
      .pipe(
        tap(() => {
          this._loaded = true;
        }),
      );
  }

  add(user: User): Observable<WebApiResponse<User>> {
    const delayMs = 1000;
    return this.apiService
      .post<WebApiResponse<User>>(`${this._baseEndPoint}/add`, user)
      .pipe(
        delay(delayMs),
        tap(() => this._userChangedSubject.next()),
      );
  }

  update(user: User): Observable<WebApiResponse<User>> {
    const delayMs = 1000;
    return this.apiService
      .put<WebApiResponse<User>>(`${this._baseEndPoint}/update`, user)
      .pipe(
        delay(delayMs),
        tap(() => this._userChangedSubject.next()),
      );
  }

  delete(user: User): Observable<WebApiResponse<User>> {
    return this.apiService.delete<WebApiResponse<User>>(
      `${this._baseEndPoint}/remove`,
      user,
    );
  }
}
