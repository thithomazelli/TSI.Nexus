import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AccountService, ModalService } from '../services';
import { map, Observable } from 'rxjs';
import { User } from '../models/account/user';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationGuard {
  constructor(
    private accountService: AccountService,
    private modalService: ModalService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.accountService.user$.pipe(
      map((user: User | null) => {
        if (user) {
          return true;
        } else {
          this.modalService.showSweetNotification(
            'Restricted Area',
            'Leave immediately!',
            'error'
          );
          this.router.navigate(['account/login'], {
            queryParams: { returnUrl: state.url },
          });
          return false;
        }
      })
    );
  }
}

// import { Injectable } from '@angular/core';
// import {
//   CanActivate,
//   CanActivateChild,
//   Router,
//   UrlTree,
// } from '@angular/router';

// @Injectable({
//   providedIn: 'root',
// })
// export class AuthorizationGuard implements CanActivate, CanActivateChild {
//   constructor(private router: Router) {}

//   private isAuthorized(): boolean {
//     // 🔁 Ajuste aqui para sua regra real:
//     // token, session, api, store, etc
//     const token = localStorage.getItem('token');
//     return !!token;
//   }

//   canActivate(): boolean | UrlTree {
//     return this.checkAccess();
//   }

//   canActivateChild(): boolean | UrlTree {
//     return this.checkAccess();
//   }

//   private checkAccess(): boolean | UrlTree {
//     if (this.isAuthorized()) {
//       return true;
//     }

//     // 🚫 Bloqueia totalmente e redireciona
//     return this.router.createUrlTree(['/login']);
//   }
// }
