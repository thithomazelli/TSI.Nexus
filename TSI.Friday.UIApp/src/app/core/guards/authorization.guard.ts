import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  CanActivateChild,
} from '@angular/router';
import { AccountService, FeatureFlagService, ModalService } from '../services';
import { TranslationService } from '../services/translation/translation.service';
import { map, switchMap, Observable, of } from 'rxjs';
import { User } from '../models/account/user';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationGuard implements CanActivateChild {
  constructor(
    private accountService: AccountService,
    private featureFlagService: FeatureFlagService,
    private modalService: ModalService,
    private router: Router,
    private translationService: TranslationService,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> {
    return this.accountService.user$.pipe(
      switchMap((user: User | null) => {
        const requiredRoles = route.data['roles'] as string[] | undefined;

        if (!user) {
          // If the target is an account route (login/register/confirm) do not show the modal
          const isAccountRoute = state.url?.startsWith('/account');

          if (!isAccountRoute) {
            this.modalService.hideModal();
          }

          // Navigate to login without causing the modal for account routes
          this.router.navigate(['account/login'], {
            queryParams: { returnUrl: state.url },
          });
          return of(false);
        }

        if (requiredRoles && requiredRoles.length > 0) {
          const hasRole = requiredRoles.some((r) => user.roles?.includes(r));
          if (!hasRole) {
            this.modalService.showNotification(
              false,
              this.translationService.instant('ACCOUNT.ACCESS_DENIED'),
              this.translationService.instant('ACCOUNT.ACCESS_DENIED_MESSAGE'),
            );
            this.router.navigate(['']);
            return of(false);
          }
        }

        // A module behind a feature flag disappears entirely - route included - while off, the
        // same way its data disappears from every API response and the sidebar link.
        const featureFlag = route.data['featureFlag'] as string | undefined;
        if (featureFlag) {
          return this.featureFlagService.isEnabled(featureFlag).pipe(
            map((enabled) => {
              if (!enabled) {
                this.router.navigate(['not-found']);
                return false;
              }
              return true;
            }),
          );
        }

        return of(true);
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
