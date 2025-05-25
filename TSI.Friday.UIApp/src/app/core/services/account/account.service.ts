import { Injectable } from '@angular/core';
import { ApiService, Login, Register, User } from '@friday/core';
import { map, Observable, of, ReplaySubject } from 'rxjs';
import { environment } from '../../../../environments/environment.development';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private _userSource = new ReplaySubject<User | null>(1);

  user$ = this._userSource.asObservable();

  constructor(private apiService: ApiService, private router: Router) {}

  refreshUser(jwt: string | null) {
    if (jwt === null) {
      this._userSource.next(null);
      return of(undefined);
    }

    let headers = new HttpHeaders();
    headers = headers.set('Authorization', `Bearer ${jwt}`);

    return this.apiService
      .get<User>('account/refresh-user-token', headers)
      .pipe(
        map((user: User) => {
          this.setUser(user);
        })
      );
  }

  register(model: Register): Observable<Object> {
    return this.apiService.post('account/register', model);
  }

  login(model: Login) {
    return this.apiService.post<User>('account/login', model).pipe(
      map((user: User) => {
        this.setUser(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(environment.userKey);
    this._userSource.next(null);
    this.router.navigateByUrl('/');
  }

  getJWT(): string | null {
    const key = localStorage.getItem(environment.userKey);

    if (!key) {
      return null;
    }

    const user: User = JSON.parse(key);
    return user.jwt;
  }

  private setUser(user: User): void {
    if (!user) {
      return;
    }

    localStorage.setItem(environment.userKey, JSON.stringify(user));
    this._userSource.next(user);
  }
}
