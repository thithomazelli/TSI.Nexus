import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService, ThemeService, TranslationService, User } from '@nexus/core';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  let apiServiceMock: { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    // Default post() to a harmless completed Observable - startAutoLogout() can synchronously
    // cascade into logout() (which fires a fire-and-forget account/logout post) whenever a test
    // user has no tokenExpiresAtUtc, so every test needs a safe default rather than each one
    // remembering to mock it.
    apiServiceMock = { post: vi.fn().mockReturnValue(of(undefined)), get: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: apiServiceMock },
        { provide: Router, useValue: { navigateByUrl: vi.fn().mockResolvedValue(true) } },
        { provide: ThemeService, useValue: { apply: vi.fn() } },
        { provide: TranslationService, useValue: { use: vi.fn() } },
      ],
    });
    service = TestBed.inject(AccountService);
  });

  it('should be created when instantiated', () => {
    // Act
    // Assert
    expect(service).toBeTruthy();
  });

  it('should not emit on user$ when the session state is not yet known', () => {
    // Arrange
    let emissions = 0;
    service.user$.subscribe(() => emissions++);

    // Act
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(0);
  });

  it('should mark the session as logged out without touching the network when emitNoUser is called', () => {
    // Arrange
    let emitted: (User | null)[] = [];
    service.user$.subscribe((u) => emitted.push(u));

    // Act
    service.emitNoUser();
    TestBed.flushEffects();

    // Assert
    expect(emitted).toEqual([null]);
    expect(apiServiceMock.get).not.toHaveBeenCalled();
    expect(apiServiceMock.post).not.toHaveBeenCalled();
  });

  describe('getStoredUser', () => {
    afterEach(() => {
      localStorage.clear();
    });

    it('should return null when nothing is stored', () => {
      // Act
      // Assert
      expect(service.getStoredUser()).toBeNull();
    });

    it('should return the parsed user when one is stored', () => {
      // Arrange
      localStorage.setItem('nexusAppUser', JSON.stringify({ id: '1' }));

      // Act
      // Assert
      expect(service.getStoredUser()).toEqual({ id: '1' });
    });

    it('should return null instead of throwing when the stored value is not valid JSON', () => {
      // Arrange
      localStorage.setItem('nexusAppUser', 'not-json{');

      // Act
      // Assert
      expect(service.getStoredUser()).toBeNull();
    });
  });

  describe('simple delegating endpoints', () => {
    it('should post to account/register when register is called', () => {
      // Arrange
      apiServiceMock.post.mockReturnValue(of({}));

      // Act
      service.register({ userName: 'a' } as never).subscribe();

      // Assert
      expect(apiServiceMock.post).toHaveBeenCalledWith('account/register', { userName: 'a' });
    });

    it('should put to account/confirm-email when confirmEmail is called', () => {
      // Arrange
      const putMock = vi.fn().mockReturnValue(of(undefined));
      (apiServiceMock as unknown as { put: typeof putMock }).put = putMock;

      // Act
      service.confirmEmail({ userId: 'u1' } as never).subscribe();

      // Assert
      expect(putMock).toHaveBeenCalledWith('account/confirm-email', { userId: 'u1' });
    });

    it('should post to the email-scoped endpoint when resendEmailConfirmation is called', () => {
      // Arrange
      apiServiceMock.post.mockReturnValue(of(undefined));

      // Act
      service.resendEmailConfirmation('a@b.com').subscribe();

      // Assert
      expect(apiServiceMock.post).toHaveBeenCalledWith(
        'account/resend-email-confirmation/a@b.com',
        {},
      );
    });

    it('should post to the email-scoped endpoint when forgotUsernameOrPassword is called', () => {
      // Arrange
      apiServiceMock.post.mockReturnValue(of(undefined));

      // Act
      service.forgotUsernameOrPassword('a@b.com').subscribe();

      // Assert
      expect(apiServiceMock.post).toHaveBeenCalledWith(
        'account/forgot-username-or-password/a@b.com',
        {},
      );
    });

    it('should put to account/reset-password when resetPassword is called', () => {
      // Arrange
      const putMock = vi.fn().mockReturnValue(of(undefined));
      (apiServiceMock as unknown as { put: typeof putMock }).put = putMock;

      // Act
      service.resetPassword({ token: 't1' } as never).subscribe();

      // Assert
      expect(putMock).toHaveBeenCalledWith('account/reset-password', { token: 't1' });
    });
  });

  describe('isTokenExpired', () => {
    it('should return true when expiresAtUtc is missing', () => {
      // Act
      // Assert
      expect(service.isTokenExpired(null)).toBe(true);
      expect(service.isTokenExpired(undefined)).toBe(true);
    });

    it('should return true when expiresAtUtc is unparseable', () => {
      // Act
      // Assert
      expect(service.isTokenExpired('not-a-date')).toBe(true);
    });

    it('should return true when expiresAtUtc is in the past', () => {
      // Arrange
      const pastDate = new Date(Date.now() - 60_000).toISOString();

      // Act
      // Assert
      expect(service.isTokenExpired(pastDate)).toBe(true);
    });

    it('should return false when expiresAtUtc is comfortably in the future', () => {
      // Arrange
      const futureDate = new Date(Date.now() + 5 * 60_000).toISOString();

      // Act
      // Assert
      expect(service.isTokenExpired(futureDate)).toBe(false);
    });
  });

  describe('login', () => {
    it('should post credentials and emit the resulting user on user$ when login succeeds', () => {
      // Arrange
      const user = { id: '1', role: 'Master', tokenExpiresAtUtc: null } as unknown as User;
      apiServiceMock.post.mockReturnValue(of(user));

      const emitted: unknown[] = [];
      service.user$.subscribe((u) => emitted.push(u));

      // Act
      service.login({ userName: 'admin', password: 'x' } as never).subscribe();
      TestBed.flushEffects();

      // Assert
      expect(apiServiceMock.post).toHaveBeenCalledWith('account/login', {
        userName: 'admin',
        password: 'x',
      });
      expect(emitted.at(-1)).toMatchObject({ id: '1', roles: ['Master'] });
    });

    it('should make the new user visible to a fresh user$ subscriber synchronously when login succeeds', () => {
      // Regression test: this used to be backed by a Signal + toObservable(), which only reaches
      // subscribers on the next effect flush rather than synchronously on set(). Login's own
      // success handler calls setUser() then immediately navigateByUrl() in the same tick, and
      // AuthorizationGuard subscribes to user$ fresh for every navigation - with the Signal, that
      // brand-new subscription could still observe the pre-login value (no flush had happened
      // yet), reject the navigation, and bounce the user straight back to the login page they had
      // just authenticated out of. This must hold with no TestBed.flushEffects() call at all.
      // Arrange
      const user = { id: '1', tokenExpiresAtUtc: null } as unknown as User;
      apiServiceMock.post.mockReturnValue(of(user));

      // Act
      service.login({ userName: 'admin', password: 'x' } as never).subscribe();

      let sawImmediately: unknown;
      service.user$.subscribe((u) => (sawImmediately = u));

      // Assert
      expect(sawImmediately).toMatchObject({ id: '1' });
    });

    it('should apply the saved theme and language preferences when the logged-in user has them', () => {
      // Arrange
      const themeService = TestBed.inject(ThemeService);
      const translationService = TestBed.inject(TranslationService);
      const user = {
        id: '1',
        tokenExpiresAtUtc: null,
        theme: 'dark',
        language: 'es',
      } as unknown as User;
      apiServiceMock.post.mockReturnValue(of(user));

      // Act
      service.login({ userName: 'admin', password: 'x' } as never).subscribe();

      // Assert
      expect(themeService.apply).toHaveBeenCalledWith('dark');
      expect(translationService.use).toHaveBeenCalledWith('es');
    });

    it('should not touch theme or language when the user has neither saved', () => {
      // Arrange
      const themeService = TestBed.inject(ThemeService);
      const translationService = TestBed.inject(TranslationService);
      const user = { id: '1', tokenExpiresAtUtc: null } as unknown as User;
      apiServiceMock.post.mockReturnValue(of(user));

      // Act
      service.login({ userName: 'admin', password: 'x' } as never).subscribe();

      // Assert
      expect(themeService.apply).not.toHaveBeenCalled();
      expect(translationService.use).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear the stored user and emit null on user$ even when the server call fails', () => {
      // Arrange
      apiServiceMock.post.mockReturnValue({
        subscribe: (observer: { error: (e: unknown) => void }) => observer.error(new Error('down')),
      });

      const emitted: unknown[] = [];
      service.user$.subscribe((u) => emitted.push(u));

      // Act
      service.logout();
      TestBed.flushEffects();

      // Assert
      expect(emitted.at(-1)).toBeNull();
      expect(apiServiceMock.post).toHaveBeenCalledWith('account/logout', {});
    });

    it('should ignore a refreshUser call that was already in flight when logout runs', () => {
      // Arrange
      const refresh$ = new Subject<User>();
      apiServiceMock.get = vi.fn().mockReturnValue(refresh$);

      const emitted: unknown[] = [];
      service.user$.subscribe((u) => emitted.push(u));

      // Act
      service.refreshUser().subscribe();
      service.logout();
      TestBed.flushEffects();
      expect(emitted.at(-1)).toBeNull();

      // The pre-logout refresh resolves afterwards, against the cookie that was still valid when
      // it was issued - it must not resurrect the session logout() just cleared.
      refresh$.next({ id: '1', tokenExpiresAtUtc: null } as unknown as User);
      refresh$.complete();
      TestBed.flushEffects();

      // Assert
      expect(emitted.at(-1)).toBeNull();
    });

    it('should let a fresh login after logout set the user again', () => {
      // Arrange
      const user = { id: '1', tokenExpiresAtUtc: null } as unknown as User;

      const emitted: unknown[] = [];
      service.user$.subscribe((u) => emitted.push(u));

      // Act
      service.logout();
      TestBed.flushEffects();
      expect(emitted.at(-1)).toBeNull();

      apiServiceMock.post.mockReturnValue(of(user));
      service.login({ userName: 'admin', password: 'x' } as never).subscribe();
      TestBed.flushEffects();

      // Assert
      expect(emitted.at(-1)).toMatchObject({ id: '1' });
    });

    it('should clear a pending auto-logout timer so it cannot fire when logout is called', () => {
      // Arrange
      vi.useFakeTimers();
      try {
        service.startAutoLogout(new Date(Date.now() + 60_000).toISOString());

        // Act
        service.logout();
        apiServiceMock.get.mockClear();

        vi.advanceTimersByTime(60_000);

        // Assert
        expect(apiServiceMock.get).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('should navigate to logout then to login when navigation succeeds', async () => {
      // Arrange
      const router = TestBed.inject(Router);

      // Act
      service.logout();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(router.navigateByUrl).toHaveBeenNthCalledWith(1, '/account/logout', {
        replaceUrl: true,
      });
      expect(router.navigateByUrl).toHaveBeenNthCalledWith(2, '/account/login');
    });

    it('should still try to navigate to login when the logout navigation promise rejects', async () => {
      // Arrange
      const router = TestBed.inject(Router);
      (router.navigateByUrl as ReturnType<typeof vi.fn>).mockReturnValueOnce(
        Promise.reject(new Error('nav failed')),
      );

      // Act
      service.logout();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(router.navigateByUrl).toHaveBeenCalledWith('/account/login');
    });

    it('should swallow a synchronous throw when the fallback login navigation throws', async () => {
      // Arrange
      const router = TestBed.inject(Router);
      (router.navigateByUrl as ReturnType<typeof vi.fn>)
        .mockReturnValueOnce(Promise.reject(new Error('nav failed')))
        .mockImplementationOnce(() => {
          throw new Error('boom');
        });

      // Act
      // Assert
      expect(() => service.logout()).not.toThrow();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });
  });

  describe('startAutoLogout / attemptRenewalOrLogout', () => {
    it('should clear an already-running timer when starting a new one', () => {
      // Arrange
      vi.useFakeTimers();
      try {
        service.startAutoLogout(new Date(Date.now() + 60_000).toISOString());

        // Act
        // Assert
        expect(() =>
          service.startAutoLogout(new Date(Date.now() + 120_000).toISOString()),
        ).not.toThrow();
      } finally {
        vi.useRealTimers();
      }
    });

    it('should attempt a renewal when the scheduled timer fires', () => {
      // Arrange
      vi.useFakeTimers();
      try {
        apiServiceMock.get.mockReturnValue(of({ id: '1', tokenExpiresAtUtc: null } as unknown as User));

        // Act
        service.startAutoLogout(new Date(Date.now() + 60_000).toISOString());
        vi.advanceTimersByTime(60_000);

        // Assert
        expect(apiServiceMock.get).toHaveBeenCalledWith('account/refresh-user-token');
      } finally {
        vi.useRealTimers();
      }
    });

    it('should log out immediately when expiresAtUtc is unparseable', () => {
      // Arrange
      const emitted: unknown[] = [];
      service.user$.subscribe((u) => emitted.push(u));

      // Act
      service.startAutoLogout('not-a-date');

      // Assert
      expect(emitted.at(-1)).toBeNull();
    });

    it('should attempt a renewal immediately when the token has already expired', () => {
      // Arrange
      apiServiceMock.get.mockReturnValue(of({ id: '1', tokenExpiresAtUtc: null } as unknown as User));

      // Act
      service.startAutoLogout(new Date(Date.now() - 1000).toISOString());

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledWith('account/refresh-user-token');
    });

    it('should log out when the renewal attempt fails', () => {
      // Arrange
      apiServiceMock.get.mockReturnValue(throwError(() => new Error('down')));
      const emitted: unknown[] = [];
      service.user$.subscribe((u) => emitted.push(u));

      // Act
      service.startAutoLogout(new Date(Date.now() - 1000).toISOString());

      // Assert
      expect(emitted.at(-1)).toBeNull();
    });
  });

  describe('refreshUser', () => {
    it('should hit the refresh endpoint and set the user when the request succeeds', () => {
      // Arrange
      const user = { id: '1', role: 'Master', tokenExpiresAtUtc: null } as unknown as User;
      apiServiceMock.get.mockReturnValue(of(user));

      const emitted: unknown[] = [];
      service.user$.subscribe((u) => emitted.push(u));

      // Act
      service.refreshUser().subscribe();
      TestBed.flushEffects();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledWith('account/refresh-user-token');
      expect(emitted.at(-1)).toMatchObject({ id: '1', roles: ['Master'] });
    });

    it('should dedupe concurrent calls onto a single in-flight request', () => {
      // Arrange
      const response$ = new Subject<User>();
      apiServiceMock.get.mockReturnValue(response$);

      let firstDone = false;
      let secondDone = false;

      // Act
      service.refreshUser().subscribe(() => (firstDone = true));
      service.refreshUser().subscribe(() => (secondDone = true));

      expect(apiServiceMock.get).toHaveBeenCalledTimes(1);

      response$.next({ id: '1', tokenExpiresAtUtc: null } as unknown as User);
      response$.complete();

      // Assert
      expect(firstDone).toBe(true);
      expect(secondDone).toBe(true);
    });

    it('should start a new request when the previous one has completed', () => {
      // Arrange
      const first$ = new Subject<User>();
      apiServiceMock.get.mockReturnValue(first$);

      // Act
      service.refreshUser().subscribe();
      first$.next({ id: '1', tokenExpiresAtUtc: null } as unknown as User);
      first$.complete();

      apiServiceMock.get.mockReturnValue(of({ id: '2', tokenExpiresAtUtc: null } as unknown as User));
      service.refreshUser().subscribe();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledTimes(2);
    });
  });
});
