import { Injectable } from '@angular/core';
import { ApiType } from '../../enums';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../../models';
import { WebApiResponse } from '../../utilities';
import { ApiService } from '@nexus/core';
import { tap } from 'rxjs/operators';

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
    return this.apiService
      .post<WebApiResponse<User>>(`${this._baseEndPoint}/add`, user)
      .pipe(tap(() => this._userChangedSubject.next()));
  }

  update(user: User): Observable<WebApiResponse<User>> {
    return this.apiService
      .put<WebApiResponse<User>>(`${this._baseEndPoint}/update`, user)
      .pipe(tap(() => this._userChangedSubject.next()));
  }

  delete(user: User): Observable<WebApiResponse<User>> {
    return this.apiService
      .delete<WebApiResponse<User>>(`${this._baseEndPoint}/remove`, user)
      .pipe(tap(() => this._userChangedSubject.next()));
  }
}
