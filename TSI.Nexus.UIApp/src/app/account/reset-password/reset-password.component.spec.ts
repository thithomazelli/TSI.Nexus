import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AccountService } from '@nexus/core';
import { Subject, of, throwError } from 'rxjs';
import { ResetPasswordComponent } from './reset-password.component';

describe('ResetPasswordComponent', () => {
  let accountServiceMock: {
    forgotUsernameOrPassword: ReturnType<typeof vi.fn>;
    resetPassword: ReturnType<typeof vi.fn>;
  };
  let queryParamMap$: Subject<{ get: (key: string) => string | null }>;
  let activatedRouteMock: { queryParamMap: Subject<{ get: (key: string) => string | null }> };

  function createComponent(): ResetPasswordComponent {
    accountServiceMock = {
      forgotUsernameOrPassword: vi.fn(),
      resetPassword: vi.fn(),
    };
    queryParamMap$ = new Subject();
    activatedRouteMock = { queryParamMap: queryParamMap$ };

    return new ResetPasswordComponent(
      accountServiceMock as unknown as AccountService,
      new FormBuilder(),
      activatedRouteMock as unknown as ActivatedRoute,
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

  describe('ngOnInit', () => {
    it('should start on the "request" step when there is no token/email', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();
      queryParamMap$.next(paramMap({}));

      // Assert
      expect(component.step).toBe('request');
      expect(component.form.get('email')).toBeTruthy();
    });

    it('should start on the "reset" step when token and email are present', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();
      queryParamMap$.next(paramMap({ token: 'tok', email: 'a@b.com' }));

      // Assert
      expect(component.step).toBe('reset');
      expect(component.form.get('newPassword')).toBeTruthy();
    });
  });

  describe('requestReset', () => {
    it('should not submit when the form is invalid', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      queryParamMap$.next(paramMap({}));

      // Act
      component.requestReset();

      // Assert
      expect(component.submitted).toBe(true);
      expect(accountServiceMock.forgotUsernameOrPassword).not.toHaveBeenCalled();
    });

    it('should move to the "sent" step when the request succeeds', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      queryParamMap$.next(paramMap({}));
      accountServiceMock.forgotUsernameOrPassword.mockReturnValue(of(undefined));
      component.form.setValue({ email: 'a@b.com' });

      // Act
      component.requestReset();

      // Assert
      expect(accountServiceMock.forgotUsernameOrPassword).toHaveBeenCalledWith('a@b.com');
      expect(component.step).toBe('sent');
    });

    it('should surface an error message when the request fails', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      queryParamMap$.next(paramMap({}));
      accountServiceMock.forgotUsernameOrPassword.mockReturnValue(
        throwError(() => ({ error: { errors: ['E-mail não encontrado'] } })),
      );
      component.form.setValue({ email: 'a@b.com' });

      // Act
      component.requestReset();

      // Assert
      expect(component.errorMessages).toEqual(['E-mail não encontrado']);
    });

    it('should fall back to the plain response.error string when there is no errors array', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      queryParamMap$.next(paramMap({}));
      accountServiceMock.forgotUsernameOrPassword.mockReturnValue(
        throwError(() => ({ error: 'Conta bloqueada' })),
      );
      component.form.setValue({ email: 'a@b.com' });

      // Act
      component.requestReset();

      // Assert
      expect(component.errorMessages).toEqual(['Conta bloqueada']);
    });

    it('should fall back to a generic message when the response has no error at all', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      queryParamMap$.next(paramMap({}));
      accountServiceMock.forgotUsernameOrPassword.mockReturnValue(throwError(() => ({})));
      component.form.setValue({ email: 'a@b.com' });

      // Act
      component.requestReset();

      // Assert
      expect(component.errorMessages).toEqual(['Erro ao enviar o e-mail.']);
    });
  });

  describe('resetPassword', () => {
    it('should not submit when the form/token/email is invalid', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      queryParamMap$.next(paramMap({}));

      // Act
      component.resetPassword();

      // Assert
      expect(accountServiceMock.resetPassword).not.toHaveBeenCalled();
    });

    it('should reset the password and move to the "done" step when the request succeeds', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      queryParamMap$.next(paramMap({ token: 'tok', email: 'a@b.com' }));
      accountServiceMock.resetPassword.mockReturnValue(of(undefined));
      component.form.setValue({ newPassword: '123456' });

      // Act
      component.resetPassword();

      // Assert
      expect(accountServiceMock.resetPassword).toHaveBeenCalledWith({
        token: 'tok',
        email: 'a@b.com',
        newPassword: '123456',
      });
      expect(component.step).toBe('done');
    });

    it('should surface an error message when the request fails', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      queryParamMap$.next(paramMap({ token: 'bad', email: 'a@b.com' }));
      accountServiceMock.resetPassword.mockReturnValue(
        throwError(() => ({ error: { errors: ['Token expirado'] } })),
      );
      component.form.setValue({ newPassword: '123456' });

      // Act
      component.resetPassword();

      // Assert
      expect(component.errorMessages).toEqual(['Token expirado']);
    });

    it('should fall back to the plain response.error string when there is no errors array', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      queryParamMap$.next(paramMap({ token: 'tok', email: 'a@b.com' }));
      accountServiceMock.resetPassword.mockReturnValue(
        throwError(() => ({ error: 'Token invalido' })),
      );
      component.form.setValue({ newPassword: '123456' });

      // Act
      component.resetPassword();

      // Assert
      expect(component.errorMessages).toEqual(['Token invalido']);
    });

    it('should fall back to a generic message when the response has no error at all', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      queryParamMap$.next(paramMap({ token: 'tok', email: 'a@b.com' }));
      accountServiceMock.resetPassword.mockReturnValue(throwError(() => ({})));
      component.form.setValue({ newPassword: '123456' });

      // Act
      component.resetPassword();

      // Assert
      expect(component.errorMessages).toEqual(['Erro ao redefinir a senha.']);
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
