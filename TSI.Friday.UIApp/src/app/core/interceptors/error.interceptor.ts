import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AccountService } from '../services';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private accountService: AccountService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next
      .handle(request)
      .pipe
      //   catchError((err: HttpErrorResponse) => {
      //     const jwt = this.accountService.getJWT();
      //     if (!jwt) {
      //       return throwError(() => err);
      //     }

      //     if (this.accountService.isTokenExpired(jwt)) {
      //       this.accountService.logout();
      //       return throwError(() => err);
      //     }

      //     return throwError(() => err);
      //   }),
      ();
  }
}
