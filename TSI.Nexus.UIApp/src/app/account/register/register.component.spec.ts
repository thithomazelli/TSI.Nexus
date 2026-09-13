import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService, ModalService, TranslationService } from '@nexus/core';
import { Subject, of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let accountServiceMock: { user$: Subject<unknown>; register: ReturnType<typeof vi.fn> };
  let modalServiceMock: { showSweetNotification: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): RegisterComponent {
    accountServiceMock = { user$: new Subject(), register: vi.fn() };
    modalServiceMock = { showSweetNotification: vi.fn() };
    routerMock = { navigateByUrl: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new RegisterComponent(
      accountServiceMock as unknown as AccountService,
      modalServiceMock as unknown as ModalService,
      new FormBuilder(),
      routerMock as unknown as Router,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  it('should redirect home immediately when already logged in', () => {
    // Arrange
    const component = createComponent();

    // Act
    accountServiceMock.user$.next({ id: 'u1' });

    // Assert
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should not redirect when there is no logged-in user', () => {
    // Arrange
    const component = createComponent();

    // Act
    accountServiceMock.user$.next(null);

    // Assert
    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
  });

  describe('register', () => {
    it('should not submit an invalid form', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.register();

      // Assert
      expect(component.submitted).toBe(true);
      expect(accountServiceMock.register).not.toHaveBeenCalled();
    });

    it('should register and navigate to login when the registration succeeds', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      accountServiceMock.register.mockReturnValue(
        of({ data: { id: 'u1' }, message: 'Welcome' }),
      );

      component.form.setValue({
        firstName: 'Ana',
        lastName: 'Silva',
        email: 'ana@example.com',
        password: '123456',
      });

      // Act
      component.register();

      // Assert
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        'ACCOUNT.USER_REGISTERED',
        'Welcome',
        'success',
      );
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('account/login');
    });

    it('should surface server validation errors when the registration request fails', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      accountServiceMock.register.mockReturnValue(
        throwError(() => ({ error: { errors: ['Email already in use'] } })),
      );

      component.form.setValue({
        firstName: 'Ana',
        lastName: 'Silva',
        email: 'ana@example.com',
        password: '123456',
      });

      // Act
      component.register();

      // Assert
      expect(component.errorMessages).toEqual(['Email already in use']);
    });

    it('should append a plain server error when there is no errors array', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      accountServiceMock.register.mockReturnValue(
        throwError(() => ({ error: 'E-mail já cadastrado' })),
      );

      component.form.setValue({
        firstName: 'Ana',
        lastName: 'Silva',
        email: 'ana@example.com',
        password: '123456',
      });

      // Act
      component.register();

      // Assert
      expect(component.errorMessages).toEqual(['E-mail já cadastrado']);
    });

    it('should fall back to the generic message without throwing when response.error itself is null', () => {
      // Regression test: a failure that never reaches the API with a JSON body (dead
      // upstream/dev-proxy 500, timeout) carries response.error === null. response.error.errors
      // used to throw reading .errors off null right there in the error handler, aborting before
      // errorMessages/markForCheck() ever ran.
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      accountServiceMock.register.mockReturnValue(
        throwError(() => ({ status: 500, error: null })),
      );

      component.form.setValue({
        firstName: 'Ana',
        lastName: 'Silva',
        email: 'ana@example.com',
        password: '123456',
      });

      // Act
      // Assert
      expect(() => component.register()).not.toThrow();
      expect(component.errorMessages).toEqual(['ACCOUNT.SERVER_ERROR']);
    });
  });
});
