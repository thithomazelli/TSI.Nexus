import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService, TranslationService } from '@nexus/core';
import { Subject, of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let accountServiceMock: { user$: Subject<unknown>; login: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let queryParamMap$: Subject<{ get: (key: string) => string | null }>;
  let activatedRouteMock: { queryParamMap: Subject<{ get: (key: string) => string | null }> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): LoginComponent {
    accountServiceMock = { user$: new Subject(), login: vi.fn() };
    routerMock = { navigateByUrl: vi.fn() };
    queryParamMap$ = new Subject();
    activatedRouteMock = { queryParamMap: queryParamMap$ };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new LoginComponent(
      accountServiceMock as unknown as AccountService,
      new FormBuilder(),
      routerMock as unknown as Router,
      activatedRouteMock as unknown as ActivatedRoute,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  function paramMap(entries: Record<string, string | null>) {
    return { get: (key: string) => entries[key] ?? null };
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  it('should redirect home immediately when already logged in', () => {
    // Arrange
    createComponent();

    // Act
    accountServiceMock.user$.next({ id: 'u1' });

    // Assert
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should pick up the returnUrl query param when logged out', () => {
    // Arrange
    const component = createComponent();
    accountServiceMock.user$.next(null);

    // Act
    queryParamMap$.next(paramMap({ returnUrl: '/orders' }));

    // Assert
    expect(component.returnUrl).toBe('/orders');
  });

  it('should not touch returnUrl when the query param map itself is falsy', () => {
    // Arrange
    const component = createComponent();
    accountServiceMock.user$.next(null);

    // Act
    queryParamMap$.next(null as unknown as { get: (key: string) => string | null });

    // Assert
    expect(component.returnUrl).toBeNull();
  });

  describe('login', () => {
    it('should not submit when the form is invalid', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      const result$ = component.login();
      let value: unknown;
      result$.subscribe((v) => (value = v));

      // Assert
      expect(value).toBeNull();
      expect(component.submitted).toBe(true);
      expect(accountServiceMock.login).not.toHaveBeenCalled();
    });

    it('should navigate to returnUrl when the login succeeds', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      accountServiceMock.user$.next(null);
      queryParamMap$.next(paramMap({ returnUrl: '/orders' }));
      accountServiceMock.login.mockReturnValue(of({ data: { id: 'u1' } }));
      component.form.setValue({ userName: 'admin', password: 'x' });

      // Act
      component.login().subscribe();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/orders');
    });

    it('should navigate to the home route when there is no returnUrl', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      accountServiceMock.login.mockReturnValue(of({ data: { id: 'u1' } }));
      component.form.setValue({ userName: 'admin', password: 'x' });

      // Act
      component.login().subscribe();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('');
    });

    it('should surface server validation errors when the login fails', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      accountServiceMock.login.mockReturnValue(
        throwError(() => ({ error: { errors: ['Invalid credentials'] } })),
      );
      component.form.setValue({ userName: 'admin', password: 'wrong' });

      // Act
      component.login().subscribe({ error: () => {} });

      // Assert
      expect(component.errorMessages).toEqual(['Invalid credentials']);
    });

    it('should append a plain string server error to errorMessages', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      accountServiceMock.login.mockReturnValue(throwError(() => ({ error: 'Conta bloqueada' })));
      component.form.setValue({ userName: 'admin', password: 'wrong' });

      // Act
      component.login().subscribe({ error: () => {} });

      // Assert
      expect(component.errorMessages).toEqual(['Conta bloqueada']);
    });

    it('should fall back to a translated generic error message when the response has no details', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      accountServiceMock.login.mockReturnValue(throwError(() => ({ error: {} })));
      component.form.setValue({ userName: 'admin', password: 'wrong' });

      // Act
      component.login().subscribe({ error: () => {} });

      // Assert
      expect(component.errorMessages).toEqual(['ACCOUNT.SERVER_ERROR']);
    });

    it('should fall back to the generic message without throwing when response.error itself is null', () => {
      // Regression test: a failure that never reaches the API with a JSON body - a dead
      // upstream/dev-proxy 500, a timeout - carries response.error === null, not an object with
      // no .errors. `response.error.errors` used to throw reading .errors off null right there in
      // tap()'s error handler, which aborted before errorMessages/markForCheck() ever ran and left
      // the login page blank with no feedback at all, instead of falling through to this message.
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      accountServiceMock.login.mockReturnValue(throwError(() => ({ status: 500, error: null })));
      component.form.setValue({ userName: 'admin', password: 'wrong' });

      // Act / Assert
      expect(() => component.login().subscribe({ error: () => {} })).not.toThrow();
      expect(component.errorMessages).toEqual(['ACCOUNT.SERVER_ERROR']);
    });
  });

  describe('resendEmailConfirmation', () => {
    it('should navigate to the resend-confirmation route when called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.resendEmailConfirmation();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith(
        '/account/send-email/resend-email-confirmation',
      );
    });
  });

  describe('togglePasswordVisibility', () => {
    it('should flip passwordVisible when called', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.passwordVisible).toBe(false);
      component.togglePasswordVisibility();
      expect(component.passwordVisible).toBe(true);
    });
  });
});
