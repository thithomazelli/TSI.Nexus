import { ActivatedRoute, Router } from '@angular/router';
import { AccountService, ModalService } from '@nexus/core';
import { Subject, of } from 'rxjs';
import { ConfirmEmailComponent } from './confirm-email.component';

describe('ConfirmEmailComponent', () => {
  let accountServiceMock: {
    user$: Subject<unknown>;
    confirmEmail: ReturnType<typeof vi.fn>;
  };
  let modalServiceMock: { showSweetNotification: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let queryParamMap$: Subject<{ get: (key: string) => string | null }>;
  let activatedRouteMock: { queryParamMap: Subject<{ get: (key: string) => string | null }> };

  function createComponent(): ConfirmEmailComponent {
    accountServiceMock = { user$: new Subject(), confirmEmail: vi.fn() };
    modalServiceMock = { showSweetNotification: vi.fn().mockResolvedValue(undefined) };
    routerMock = { navigate: vi.fn() };
    queryParamMap$ = new Subject();
    activatedRouteMock = { queryParamMap: queryParamMap$ };

    return new ConfirmEmailComponent(
      accountServiceMock as unknown as AccountService,
      modalServiceMock as unknown as ModalService,
      routerMock as unknown as Router,
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

  it('should redirect home immediately when the user is already logged in', () => {
    // Arrange
    const component = createComponent();
    component.ngOnInit();

    // Act
    accountServiceMock.user$.next({ id: 'u1' });

    // Assert
    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should confirm the email using the token/email query params when logged out', async () => {
    // Arrange
    const component = createComponent();
    accountServiceMock.confirmEmail.mockReturnValue(
      of({ value: { title: 'OK', message: 'Confirmed' } }),
    );
    component.ngOnInit();
    accountServiceMock.user$.next(null);

    // Act
    queryParamMap$.next(paramMap({ token: 'tok', email: 'a@b.com' }));
    // The component's subscribe callback is itself async (awaits showSweetNotification before
    // navigating) - subscribe() doesn't wait for that promise, so the test does.
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Assert
    expect(accountServiceMock.confirmEmail).toHaveBeenCalledWith({
      token: 'tok',
      email: 'a@b.com',
    });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/account/login']);
  });

  it('should show an error notification and redirect to login when the confirmation fails', async () => {
    // Arrange
    const component = createComponent();
    accountServiceMock.confirmEmail.mockReturnValue({
      subscribe: (observer: { error: (e: unknown) => void }) =>
        observer.error({ error: 'bad token' }),
    });
    component.ngOnInit();
    accountServiceMock.user$.next(null);

    // Act
    queryParamMap$.next(paramMap({ token: 'bad', email: 'a@b.com' }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Assert
    expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
      'Failed',
      'bad token',
      'error',
    );
    expect(routerMock.navigate).toHaveBeenCalledWith(['/account/login']);
  });
});
