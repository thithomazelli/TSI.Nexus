import { Injectable } from '@angular/core';
import { ApiType } from '../../enums';
import { BehaviorSubject, Observable } from 'rxjs';
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
  private _userChangedSubject = new BehaviorSubject<void>(undefined);
  userChanged$ = this._userChangedSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getAll(): Observable<WebApiResponse<User[]>> {
    return this.apiService
      .get<WebApiResponse<User[]>>(`${this._baseEndPoint}/getAll`)
      .pipe(
        tap((response) => {
          this._users$.next(response.data);
        }),
      );
  }

  getById(id: string): Observable<WebApiResponse<User>> {
    return this.apiService.get<WebApiResponse<User>>(
      `${this._baseEndPoint}/getById/${id}`,
    );
  }

  refresh(): Observable<WebApiResponse<User[]>> {
    return this.getAll();
  }

  add(user: User): Observable<WebApiResponse<User>> {
    const delayMs = 1000; // delay de 1 segundo para teste visual
    return this.apiService
      .post<WebApiResponse<User>>(`${this._baseEndPoint}/add`, user)
      .pipe(
        delay(delayMs),
        tap(() => this._userChangedSubject.next()),
      );
  }

  update(user: User): Observable<WebApiResponse<User>> {
    const delayMs = 1000; // delay de 1 segundo para teste visual
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
