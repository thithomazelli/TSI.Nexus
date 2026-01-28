import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  CanActivateChild,
} from '@angular/router';
import { AccountService, ModalService } from '../services';
import { map, Observable } from 'rxjs';
import { User } from '../models/account/user';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationGuard implements CanActivateChild {
  constructor(
    private accountService: AccountService,
    private modalService: ModalService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> {
    return this.accountService.user$.pipe(
      map((user: User | null) => {
        const requiredRoles = route.data['roles'] as string[] | undefined;

        if (!user) {
          // If the target is an account route (login/register/confirm) do not show the modal
          const isAccountRoute = state.url?.startsWith('/account');

          if (!isAccountRoute) {
            this.modalService.showSweetNotification(
              'Restricted Area',
              'Leave immediately!',
              'error',
            );
          }

          // Navigate to login without causing the modal for account routes
          this.router.navigate(['account/login'], {
            queryParams: { returnUrl: state.url },
          });
          return false;
        }

        if (requiredRoles && requiredRoles.length > 0) {
          const hasRole = requiredRoles.some((r) => user.roles?.includes(r));
          if (!hasRole) {
            this.modalService.showSweetNotification(
              'Access denied',
              'You do not have permission to access this area',
              'error',
            );
            this.router.navigate(['']);
            return false;
          }
        }

        return true;
      }),
    );
  }

  // Ensure child routes are also checked when parent uses canActivateChild
  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> {
    return this.canActivate(route, state);
  }
}
