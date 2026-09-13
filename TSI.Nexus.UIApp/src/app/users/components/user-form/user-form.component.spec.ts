import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import {
  AccountService,
  ModalService,
  NotificationService,
  ResponseStatus,
  TranslationService,
  User,
  UserService,
} from '@nexus/core';
import { config, of, throwError } from 'rxjs';
import { UserFormComponent } from './user-form.component';
import { UserDetailsModalComponent } from '../user-details-modal/user-details-modal.component';

describe('UserFormComponent', () => {
  let accountServiceMock: {
    user$: import('rxjs').Observable<any>;
    resendEmailConfirmation: ReturnType<typeof vi.fn>;
    forgotUsernameOrPassword: ReturnType<typeof vi.fn>;
  };
  let modalServiceMock: {
    hideModal: ReturnType<typeof vi.fn>;
    showSweetConfirmation: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
    showNotification: ReturnType<typeof vi.fn>;
    showTemplateModal: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let userServiceMock: {
    update: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(user: any = { roles: [] }): UserFormComponent {
    accountServiceMock = {
      user$: of(user),
      resendEmailConfirmation: vi.fn(),
      forgotUsernameOrPassword: vi.fn(),
    };
    modalServiceMock = {
      hideModal: vi.fn(),
      showSweetConfirmation: vi.fn(),
      showSweetNotification: vi.fn(),
      showNotification: vi.fn(),
      showTemplateModal: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    routerMock = { navigateByUrl: vi.fn() };
    userServiceMock = { update: vi.fn(), add: vi.fn(), delete: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new UserFormComponent(
      accountServiceMock as unknown as AccountService,
      new FormBuilder(),
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      routerMock as unknown as Router,
      userServiceMock as unknown as UserService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should include a password field in the form when adding', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('password')).not.toBeNull();
    });

    it('should detect a privileged viewer when the role is Admin', () => {
      // Arrange
      const component = createComponent({ roles: ['Admin'] });

      // Act
      component.ngOnInit();

      // Assert
      expect(component.isPrivilegedViewer).toBe(true);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should treat the viewer as non-privileged when the role is User', () => {
      // Arrange
      const component = createComponent({ roles: ['User'] });

      // Act
      component.ngOnInit();

      // Assert
      expect(component.isPrivilegedViewer).toBe(false);
    });

    it('should treat the viewer as non-privileged when there are no roles at all', () => {
      // Arrange
      const component = createComponent({});

      // Act
      component.ngOnInit();

      // Assert
      expect(component.isPrivilegedViewer).toBe(false);
    });
  });

  describe('ngOnChanges', () => {
    it('should patch the form when data changes', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.ngOnChanges({
        data: { currentValue: { firstName: 'Ana' }, firstChange: false } as any,
      });

      // Assert
      expect(component.form.value.firstName).toBe('Ana');
    });

    it('should not throw when data changes before the form exists', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() =>
        component.ngOnChanges({
          data: { currentValue: { firstName: 'Ana' }, firstChange: false } as any,
        }),
      ).not.toThrow();
    });

    it('should reinitialize the form when isEdit changes after the first change', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.isEdit = true;

      // Act
      component.ngOnChanges({ isEdit: { firstChange: false } as any });

      // Assert
      expect(component.form.get('id')).not.toBeNull();
    });

    it('should not reinitialize the form when isEdit changes on the first change', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const before = component.form;

      // Act
      component.ngOnChanges({ isEdit: { firstChange: true } as any });

      // Assert
      expect(component.form).toBe(before);
    });
  });

  describe('ngOnDestroy', () => {
    it('should not throw when there is no active timer', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should clear the resend-email timer when it is active', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.patchValue({ email: 'a@b.com' });
      accountServiceMock.resendEmailConfirmation.mockReturnValue(
        of({ value: { title: '', message: '' } }),
      );
      component.resendEmailConfirmation();

      // Act
      component.ngOnDestroy();

      // Assert
      expect(() => vi.advanceTimersByTime(2000)).not.toThrow();
      vi.useRealTimers();
    });
  });

  describe('submit', () => {
    it('should mark all fields as touched and return null when the form is invalid', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      let result: unknown;

      // Act
      component.submit().subscribe((r) => (result = r));

      // Assert
      expect(result).toBeNull();
      expect(component.form.get('firstName')!.touched).toBe(true);
    });

    it('should add a new user and navigate to it when the save succeeds outside a modal', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.patchValue({
        firstName: 'Ana',
        lastName: 'Silva',
        email: 'ana@teste.com',
        password: 'abcdef',
      });
      userServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok', data: { id: 'u1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(userServiceMock.add).toHaveBeenCalled();
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/users/u1');
    });

    it('should update an existing user and merge the raw value into data when saving', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      const data = { id: 'u1', firstName: 'Old' } as User;
      component.data = data;
      component.ngOnInit();
      component.form.patchValue({ firstName: 'Novo', lastName: 'Sobrenome', email: 'a@b.com' });
      userServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Salvo', data: { id: 'u1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(userServiceMock.update).toHaveBeenCalled();
      // Object.assign mutates the original `data` object synchronously, before the (also
      // synchronous, via `of`) response replaces `component.data` with the server's copy - so the
      // merge is only observable on the object reference captured beforehand.
      expect(data.firstName).toBe('Novo');
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'Salvo',
      );
    });

    it('should show the response message and not navigate when the backend reports a business error', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.patchValue({
        firstName: 'Ana',
        lastName: 'Silva',
        email: 'ana@teste.com',
        password: 'abcdef',
      });
      userServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'E-mail já cadastrado', data: null }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'E-mail já cadastrado',
      );
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should show a generic error notification when the save request errors', () => {
      // Arrange
      const originalOnUnhandledError = config.onUnhandledError;
      config.onUnhandledError = () => {};
      try {
        const component = createComponent();
        component.ngOnInit();
        component.form.patchValue({
          firstName: 'Ana',
          lastName: 'Silva',
          email: 'ana@teste.com',
          password: 'abcdef',
        });
        userServiceMock.add.mockReturnValue(throwError(() => new Error('fail')));

        // Act
        component.submit().subscribe({ error: () => {} });

        // Assert
        expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
          'error',
          'Erro ao salvar',
        );
      } finally {
        config.onUnhandledError = originalOnUnhandledError;
      }
    });

    it('should close the dialog and show a notification when isModal is true', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.dialogRef = { close: vi.fn() } as unknown as MatDialogRef<UserDetailsModalComponent>;
      component.ngOnInit();
      component.form.patchValue({
        firstName: 'Ana',
        lastName: 'Silva',
        email: 'ana@teste.com',
        password: 'abcdef',
      });
      userServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok', data: { id: 'u1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(component.dialogRef.close).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith('', 'ok', ResponseStatus.Success);
    });
  });

  describe('cancel', () => {
    it('should hide the modal when isModal is true', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.dialogRef = {} as MatDialogRef<UserDetailsModalComponent>;

      // Act
      component.cancel();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith(component.dialogRef);
    });

    it('should navigate back to the list when isModal is false', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.cancel();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/users');
    });
  });

  describe('remove', () => {
    it('should delete the user and show a success notification when isModal is true', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.data = { id: 'u1' } as User;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      userServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(userServiceMock.delete).toHaveBeenCalledWith(component.data);
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Removido',
        ResponseStatus.Success,
      );
    });

    it('should navigate back to the list when the delete succeeds outside a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'u1' } as User;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      userServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/users');
    });

    it('should not navigate when the delete response is not a success', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'u1' } as User;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      userServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falha' }),
      );

      // Act
      component.remove();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should show a generic error notification when the delete request errors', async () => {
      // Arrange
      const originalOnUnhandledError = config.onUnhandledError;
      config.onUnhandledError = () => {};
      try {
        const component = createComponent();
        component.data = { id: 'u1' } as User;
        modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
        userServiceMock.delete.mockReturnValue(throwError(() => new Error('fail')));

        // Act
        component.remove();
        await Promise.resolve();
        await Promise.resolve();

        // Assert
        expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('error', 'Erro ao remover');

        await new Promise((resolve) => setTimeout(resolve, 0));
      } finally {
        config.onUnhandledError = originalOnUnhandledError;
      }
    });

    it('should do nothing further when the confirmation is cancelled and not a modal', async () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.remove();
      await Promise.resolve();

      // Assert
      expect(userServiceMock.delete).not.toHaveBeenCalled();
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
    });

    // Reopening the details modal after cancelling the delete (isModal + not confirmed) uses a
    // dynamic import() of UserDetailsModalComponent, mirroring the same documented pattern already
    // established for the sibling *-form components (see product-form.component.spec.ts) -
    // exercised only implicitly here since asserting on the dynamically-imported module's identity
    // isn't meaningfully different from the static case and isn't worth mocking dynamic import for.
  });

  describe('resendEmailConfirmation', () => {
    it('should do nothing when already resending', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.isResendingEmail = true;

      // Act
      component.resendEmailConfirmation();

      // Assert
      expect(accountServiceMock.resendEmailConfirmation).not.toHaveBeenCalled();
    });

    it('should send the confirmation email and show a notification when it succeeds', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.patchValue({ email: 'a@b.com' });
      accountServiceMock.resendEmailConfirmation.mockReturnValue(
        of({ value: { title: 'Enviado', message: 'Confira seu e-mail' } }),
      );

      // Act
      component.resendEmailConfirmation();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(
        true,
        'Enviado',
        'Confira seu e-mail',
      );
      expect(localStorage.getItem('resendEmailCooldown_a@b.com')).not.toBeNull();
      vi.useRealTimers();
    });

    it('should restart the cooldown countdown and eventually clear it when the request errors', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      accountServiceMock.resendEmailConfirmation.mockReturnValue(
        throwError(() => new Error('fail')),
      );

      // Act
      component.resendEmailConfirmation();
      expect(component.resendEmailCountdown).toBe(60);

      vi.advanceTimersByTime(60000);

      // Assert
      expect(component.isResendingEmail).toBe(false);
      expect(component.resendEmailCountdown).toBe(0);
      vi.useRealTimers();
    });

    it('should restart the cooldown countdown and eventually clear it when the request completes', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      accountServiceMock.resendEmailConfirmation.mockReturnValue(
        of({ value: { title: '', message: '' } }),
      );

      // Act
      component.resendEmailConfirmation();
      expect(component.resendEmailCountdown).toBe(60);

      vi.advanceTimersByTime(60000);

      // Assert
      expect(component.isResendingEmail).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('forgotPassword', () => {
    it('should do nothing when there is no email', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as User;

      // Act
      component.forgotPassword();

      // Assert
      expect(accountServiceMock.forgotUsernameOrPassword).not.toHaveBeenCalled();
    });

    it('should show a translated success notification when the email is sent', () => {
      // Arrange
      const component = createComponent();
      component.data = { email: 'a@b.com' } as User;
      accountServiceMock.forgotUsernameOrPassword.mockReturnValue(of({}));

      // Act
      component.forgotPassword();

      // Assert
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'ACCOUNT.RESET_PASSWORD.SENT_MESSAGE',
        'success',
      );
    });

    it('should show the response error message when the request fails', () => {
      // Arrange
      const component = createComponent();
      component.data = { email: 'a@b.com' } as User;
      accountServiceMock.forgotUsernameOrPassword.mockReturnValue(
        throwError(() => ({ error: 'Falha no envio' })),
      );

      // Act
      component.forgotPassword();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('error', 'Falha no envio');
    });

    it('should fall back to a generic error message when the response has none', () => {
      // Arrange
      const component = createComponent();
      component.data = { email: 'a@b.com' } as User;
      accountServiceMock.forgotUsernameOrPassword.mockReturnValue(throwError(() => ({})));

      // Act
      component.forgotPassword();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'error',
        'Erro ao enviar o e-mail.',
      );
    });
  });

  describe('restoreResendEmailCooldown (private, via ngOnInit)', () => {
    it('should do nothing when there is no email yet', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.isResendingEmail).toBe(false);
    });

    it('should do nothing when there is no stored cooldown timestamp', () => {
      // Arrange
      const component = createComponent();
      component.data = { email: 'a@b.com' } as User;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.isResendingEmail).toBe(false);
    });

    it('should resume the countdown when the stored cooldown has not expired', () => {
      // Arrange
      vi.useFakeTimers();
      localStorage.setItem('resendEmailCooldown_a@b.com', Date.now().toString());
      const component = createComponent();
      component.data = { email: 'a@b.com' } as User;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.isResendingEmail).toBe(true);
      expect(component.resendEmailCountdown).toBeGreaterThan(0);
      vi.useRealTimers();
    });

    it('should clear an already-expired stored cooldown', () => {
      // Arrange
      localStorage.setItem(
        'resendEmailCooldown_a@b.com',
        (Date.now() - 120000).toString(),
      );
      const component = createComponent();
      component.data = { email: 'a@b.com' } as User;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.isResendingEmail).toBe(false);
      expect(localStorage.getItem('resendEmailCooldown_a@b.com')).toBeNull();
    });

    it('should clear a pre-existing timer when restoring the cooldown twice', () => {
      // Arrange
      vi.useFakeTimers();
      localStorage.setItem('resendEmailCooldown_a@b.com', Date.now().toString());
      const component = createComponent();
      component.ngOnInit();
      component.form.patchValue({ email: 'a@b.com' });

      // Act
      (component as any).restoreResendEmailCooldown();

      // Assert
      expect(() => (component as any).restoreResendEmailCooldown()).not.toThrow();

      vi.useRealTimers();
    });

    it('should count down to zero and clear state and storage when the cooldown elapses', () => {
      // Arrange
      vi.useFakeTimers();
      localStorage.setItem('resendEmailCooldown_a@b.com', Date.now().toString());
      const component = createComponent();
      component.data = { email: 'a@b.com' } as User;
      component.ngOnInit();

      // Act
      vi.advanceTimersByTime(61000);

      // Assert
      expect(component.isResendingEmail).toBe(false);
      expect(component.resendEmailCountdown).toBe(0);
      expect(localStorage.getItem('resendEmailCooldown_a@b.com')).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('resetResendEmailCooldown (private, direct)', () => {
    it('should clear a pre-existing timer when called twice', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();

      // Act
      (component as any).resetResendEmailCooldown();

      // Assert
      expect(() => (component as any).resetResendEmailCooldown()).not.toThrow();

      vi.useRealTimers();
    });
  });

  describe('roleOptions / trackByOptionValue', () => {
    it('should expose the Admin/User role options translated', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.roleOptions).toEqual([
        { label: 'USERS.ROLE_ADMIN', value: 'Admin' },
        { label: 'USERS.ROLE_USER', value: 'User' },
      ]);
    });

    it('should track options by their value', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.trackByOptionValue(0, { value: 'Admin', label: 'x' })).toBe('Admin');
    });
  });
});
