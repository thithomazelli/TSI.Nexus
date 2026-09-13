import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AccountService, FeatureFlagService, ModalService } from '../services';
import { TranslationService } from '../services/translation/translation.service';
import { AuthorizationGuard } from './authorization.guard';
import { User } from '../models/account/user';

describe('AuthorizationGuard', () => {
  let guard: AuthorizationGuard;
  let accountServiceMock: { user$: Observable<User | null> };
  let featureFlagServiceMock: { isEnabled: ReturnType<typeof vi.fn> };
  let modalServiceMock: {
    hideModal: ReturnType<typeof vi.fn>;
    showNotification: ReturnType<typeof vi.fn>;
  };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  function makeGuard(user: User | null) {
    accountServiceMock = { user$: of(user) };
    featureFlagServiceMock = { isEnabled: vi.fn().mockReturnValue(of(true)) };
    modalServiceMock = { hideModal: vi.fn(), showNotification: vi.fn() };
    routerMock = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        AuthorizationGuard,
        { provide: AccountService, useValue: accountServiceMock },
        { provide: FeatureFlagService, useValue: featureFlagServiceMock },
        { provide: ModalService, useValue: modalServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: TranslationService, useValue: { instant: (key: string) => key } },
      ],
    });
    return TestBed.inject(AuthorizationGuard);
  }

  function route(data: Record<string, unknown> = {}): ActivatedRouteSnapshot {
    return { data } as unknown as ActivatedRouteSnapshot;
  }

  function state(url = '/vehicles'): RouterStateSnapshot {
    return { url } as unknown as RouterStateSnapshot;
  }

  // Every dependency here resolves synchronously (of(...)), so canActivate()'s Observable emits
  // within the subscribe() call itself - no need for Vitest's async-completion machinery.
  function activate(r: ActivatedRouteSnapshot, s: RouterStateSnapshot): boolean {
    let result: boolean | undefined;
    guard.canActivate(r, s).subscribe((allowed) => (result = allowed));
    return result!;
  }

  it('should create the guard when instantiated', () => {
    // Act
    guard = makeGuard(null);

    // Assert
    expect(guard).toBeTruthy();
  });

  it('should redirect to login and deny access when there is no logged-in user', () => {
    // Arrange
    guard = makeGuard(null);

    // Act
    const allowed = activate(route(), state('/vehicles'));

    // Assert
    expect(allowed).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['account/login'], {
      queryParams: { returnUrl: '/vehicles' },
    });
    expect(modalServiceMock.hideModal).toHaveBeenCalled();
  });

  it('should not hide the modal when redirecting from an /account route', () => {
    // Arrange
    guard = makeGuard(null);

    // Act
    activate(route(), state('/account/login'));

    // Assert
    expect(modalServiceMock.hideModal).not.toHaveBeenCalled();
  });

  it('should deny access and show a notification when the user lacks a required role', () => {
    // Arrange
    guard = makeGuard({ roles: ['User'] } as User);

    // Act
    const allowed = activate(route({ roles: ['Admin'] }), state());

    // Assert
    expect(allowed).toBe(false);
    expect(modalServiceMock.showNotification).toHaveBeenCalledWith(
      false,
      'ACCOUNT.ACCESS_DENIED',
      'ACCOUNT.ACCESS_DENIED_MESSAGE',
    );
    expect(routerMock.navigate).toHaveBeenCalledWith(['']);
  });

  it('should allow access when the user has one of the required roles', () => {
    // Arrange
    guard = makeGuard({ roles: ['Admin'] } as User);

    // Act / Assert
    expect(activate(route({ roles: ['Admin', 'Master'] }), state())).toBe(true);
  });

  it('should redirect to not-found when a required feature flag is disabled', () => {
    // Arrange
    guard = makeGuard({ roles: ['Admin'] } as User);
    featureFlagServiceMock.isEnabled.mockReturnValue(of(false));

    // Act
    const allowed = activate(route({ featureFlag: 'FleetModule' }), state());

    // Assert
    expect(allowed).toBe(false);
    expect(routerMock.navigate).toHaveBeenCalledWith(['not-found']);
  });

  it('should require every flag in an array to be enabled', () => {
    // Arrange
    guard = makeGuard({ roles: ['Admin'] } as User);
    featureFlagServiceMock.isEnabled.mockImplementation((flag: string) =>
      of(flag === 'FleetModule'),
    );

    // Act
    const allowed = activate(route({ featureFlag: ['FleetModule', 'Vehicles'] }), state());

    // Assert
    expect(allowed).toBe(false);
  });

  it('should allow access when every flag in an array is enabled', () => {
    // Arrange
    guard = makeGuard({ roles: ['Admin'] } as User);
    featureFlagServiceMock.isEnabled.mockReturnValue(of(true));

    // Act
    const allowed = activate(route({ featureFlag: ['FleetModule', 'Vehicles'] }), state());

    // Assert
    expect(allowed).toBe(true);
    expect(routerMock.navigate).not.toHaveBeenCalledWith(['not-found']);
  });

  it('should allow access when there are no role or feature flag restrictions', () => {
    // Arrange
    guard = makeGuard({ roles: [] } as unknown as User);

    // Act / Assert
    expect(activate(route(), state())).toBe(true);
  });

  it('should delegate to canActivate when canActivateChild is called', () => {
    // Arrange
    guard = makeGuard({ roles: ['Admin'] } as User);

    // Act
    let result: boolean | undefined;
    guard.canActivateChild(route(), state()).subscribe((allowed) => (result = allowed));

    // Assert
    expect(result).toBe(true);
  });
});
