import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService, ModalService, TranslationService } from '@nexus/core';
import { Subject, of, throwError } from 'rxjs';
import { SendEmailComponent } from './send-email.component';

describe('SendEmailComponent', () => {
  let accountServiceMock: {
    user$: Subject<unknown>;
    resendEmailConfirmation: ReturnType<typeof vi.fn>;
    forgotUsernameOrPassword: ReturnType<typeof vi.fn>;
  };
  let modalServiceMock: { showSweetNotification: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let activatedRouteMock: { snapshot: { paramMap: { get: ReturnType<typeof vi.fn> } } };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };

  function createComponent(mode: string | null): SendEmailComponent {
    accountServiceMock = {
      user$: new Subject(),
      resendEmailConfirmation: vi.fn(),
      forgotUsernameOrPassword: vi.fn(),
    };
    modalServiceMock = { showSweetNotification: vi.fn() };
    routerMock = { navigateByUrl: vi.fn() };
    activatedRouteMock = { snapshot: { paramMap: { get: vi.fn().mockReturnValue(mode) } } };
    cdrMock = { markForCheck: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };

    return new SendEmailComponent(
      accountServiceMock as unknown as AccountService,
      modalServiceMock as unknown as ModalService,
      new FormBuilder(),
      routerMock as unknown as Router,
      activatedRouteMock as unknown as ActivatedRoute,
      cdrMock as unknown as ChangeDetectorRef,
      translationServiceMock as unknown as TranslationService,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component).toBeTruthy();
  });

  it('should redirect home immediately when the user is already logged in', () => {
    // Arrange
    const component = createComponent('resend-email-confirmation');
    component.ngOnInit();

    // Act
    accountServiceMock.user$.next({ id: 'u1' });

    // Assert
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('should read the mode from the route and initialize the form when the user is logged out', () => {
    // Arrange
    const component = createComponent('resend-email-confirmation');
    component.ngOnInit();

    // Act
    accountServiceMock.user$.next(null);

    // Assert
    expect(component.mode).toBe('resend-email-confirmation');
    expect(component.form.get('email')).toBeTruthy();
  });

  it('should fall back to an empty mode when the route has none', () => {
    // Arrange
    const component = createComponent(null);
    component.ngOnInit();

    // Act
    accountServiceMock.user$.next(null);

    // Assert
    expect(component.mode).toBe('');
  });

  describe('sendEmail', () => {
    it('should do nothing when the form is invalid', () => {
      // Arrange
      const component = createComponent('resend-email-confirmation');
      component.ngOnInit();
      accountServiceMock.user$.next(null);

      // Act
      component.sendEmail();

      // Assert
      expect(accountServiceMock.resendEmailConfirmation).not.toHaveBeenCalled();
    });

    it('should resend the email confirmation and navigate to login when saving succeeds', () => {
      // Arrange
      const component = createComponent('resend-email-confirmation');
      component.ngOnInit();
      accountServiceMock.user$.next(null);
      accountServiceMock.resendEmailConfirmation.mockReturnValue(
        of({ value: { title: 'OK', message: 'Sent' } }),
      );
      component.form.setValue({ email: 'a@b.com' });

      // Act
      component.sendEmail();

      // Assert
      expect(accountServiceMock.resendEmailConfirmation).toHaveBeenCalledWith('a@b.com');
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/account/login');
    });

    it('should send a forgot-password email when the mode is forgot-username-or-password', () => {
      // Arrange
      const component = createComponent('forgot-username-or-password');
      component.ngOnInit();
      accountServiceMock.user$.next(null);
      accountServiceMock.forgotUsernameOrPassword.mockReturnValue(
        of({ value: { title: 'OK', message: 'Sent' } }),
      );
      component.form.setValue({ email: 'a@b.com' });

      // Act
      component.sendEmail();

      // Assert
      expect(accountServiceMock.forgotUsernameOrPassword).toHaveBeenCalledWith('a@b.com');
    });

    it('should do nothing when the mode matches neither known flow', () => {
      // Arrange
      const component = createComponent('some-other-mode');
      component.ngOnInit();
      accountServiceMock.user$.next(null);
      component.form.setValue({ email: 'a@b.com' });

      // Act
      component.sendEmail();

      // Assert
      expect(accountServiceMock.resendEmailConfirmation).not.toHaveBeenCalled();
      expect(accountServiceMock.forgotUsernameOrPassword).not.toHaveBeenCalled();
    });

    it('should surface server validation errors when the resend request fails', () => {
      // Arrange
      const component = createComponent('resend-email-confirmation');
      component.ngOnInit();
      accountServiceMock.user$.next(null);
      accountServiceMock.resendEmailConfirmation.mockReturnValue(
        throwError(() => ({ error: { errors: ['E-mail inválido'] } })),
      );
      component.form.setValue({ email: 'a@b.com' });

      // Act
      component.sendEmail();

      // Assert
      expect(component.errorMessages).toEqual(['E-mail inválido']);
    });

    it('should fall back to the generic message without throwing when the resend response.error is null', () => {
      // Arrange
      const component = createComponent('resend-email-confirmation');
      component.ngOnInit();
      accountServiceMock.user$.next(null);
      accountServiceMock.resendEmailConfirmation.mockReturnValue(
        throwError(() => ({ status: 500, error: null })),
      );
      component.form.setValue({ email: 'a@b.com' });

      // Act
      const act = () => component.sendEmail();

      // Assert
      expect(act).not.toThrow();
      expect(component.errorMessages).toEqual(['ACCOUNT.SERVER_ERROR']);
    });

    it('should surface server validation errors when the forgot-password request fails', () => {
      // Arrange
      const component = createComponent('forgot-username-or-password');
      component.ngOnInit();
      accountServiceMock.user$.next(null);
      accountServiceMock.forgotUsernameOrPassword.mockReturnValue(
        throwError(() => ({ error: { errors: ['E-mail não encontrado'] } })),
      );
      component.form.setValue({ email: 'a@b.com' });

      // Act
      component.sendEmail();

      // Assert
      expect(component.errorMessages).toEqual(['E-mail não encontrado']);
    });

    it('should fall back to the generic message without throwing when the forgot-password response.error is null', () => {
      // Arrange
      const component = createComponent('forgot-username-or-password');
      component.ngOnInit();
      accountServiceMock.user$.next(null);
      accountServiceMock.forgotUsernameOrPassword.mockReturnValue(
        throwError(() => ({ status: 500, error: null })),
      );
      component.form.setValue({ email: 'a@b.com' });

      // Act
      const act = () => component.sendEmail();

      // Assert
      expect(act).not.toThrow();
      expect(component.errorMessages).toEqual(['ACCOUNT.SERVER_ERROR']);
    });
  });

  describe('cancel', () => {
    it('should navigate back to login when cancel is called', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      component.cancel();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/account/login');
    });
  });
});
