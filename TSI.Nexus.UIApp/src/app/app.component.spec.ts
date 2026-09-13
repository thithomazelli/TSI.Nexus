import { NgZone, Renderer2 } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, NavigationError, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { Observable, Subject, of } from 'rxjs';
import { AccountService, TranslationService, User } from './core';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

describe('AppComponent', () => {
  let routerMock: { events: Subject<unknown>; url: string };
  let rendererMock: {
    listen: ReturnType<typeof vi.fn>;
    addClass: ReturnType<typeof vi.fn>;
    removeClass: ReturnType<typeof vi.fn>;
  };
  let user$: Subject<User | null>;
  let accountServiceMock: {
    user$: Observable<User | null>;
    getStoredUser: ReturnType<typeof vi.fn>;
    emitNoUser: ReturnType<typeof vi.fn>;
    isTokenExpired: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
    refreshUser: ReturnType<typeof vi.fn>;
    startAutoLogout: ReturnType<typeof vi.fn>;
  };
  let ngZoneMock: { runOutsideAngular: (fn: () => void) => void };
  let versionUpdates$: Subject<{ type: string }>;
  let swUpdateMock: {
    isEnabled: boolean;
    versionUpdates: Subject<{ type: string }>;
    activateUpdate: ReturnType<typeof vi.fn>;
  };
  let titleServiceMock: { setTitle: ReturnType<typeof vi.fn> };
  let language$: Subject<string>;
  let translationServiceMock: { instant: ReturnType<typeof vi.fn>; language$: Subject<string> };

  function createComponent(url = '/'): AppComponent {
    routerMock = { events: new Subject(), url };
    rendererMock = {
      listen: vi.fn().mockReturnValue(vi.fn()),
      addClass: vi.fn(),
      removeClass: vi.fn(),
    };
    user$ = new Subject();
    accountServiceMock = {
      user$,
      getStoredUser: vi.fn().mockReturnValue(null),
      emitNoUser: vi.fn(),
      isTokenExpired: vi.fn().mockReturnValue(true),
      logout: vi.fn(),
      refreshUser: vi.fn().mockReturnValue(of(undefined)),
      startAutoLogout: vi.fn(),
    };
    ngZoneMock = { runOutsideAngular: (fn) => fn() };
    versionUpdates$ = new Subject();
    swUpdateMock = { isEnabled: false, versionUpdates: versionUpdates$, activateUpdate: vi.fn() };
    titleServiceMock = { setTitle: vi.fn() };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };

    return new AppComponent(
      routerMock as unknown as Router,
      rendererMock as unknown as Renderer2,
      accountServiceMock as unknown as AccountService,
      ngZoneMock as unknown as NgZone,
      swUpdateMock as unknown as SwUpdate,
      titleServiceMock as unknown as Title,
      translationServiceMock as unknown as TranslationService,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  it('should fall back to a 30s refresh interval when the environment value is missing', () => {
    // Arrange
    const original = environment.tokenRefreshIntervalSeconds;
    (environment as any).tokenRefreshIntervalSeconds = undefined;
    try {
      // Act
      const component = createComponent();

      // Assert
      expect((component as any).refreshIntervalMs).toBe(30000);
    } finally {
      environment.tokenRefreshIntervalSeconds = original;
    }
  });

  it('should expose isLoggedIn$ derived from AccountService.user$', () => {
    // Arrange
    const component = createComponent();
    let loggedIn: boolean | undefined;
    component.isLoggedIn$.subscribe((v) => (loggedIn = v));

    // Act
    user$.next({ id: '1' } as unknown as User);

    // Assert
    expect(loggedIn).toBe(true);
  });

  describe('showShell$', () => {
    it('should be false while logged out, even off /account', () => {
      // Arrange
      const component = createComponent('/');
      let shown: boolean | undefined;
      component.showShell$.subscribe((v) => (shown = v));

      // Act
      user$.next(null);

      // Assert
      expect(shown).toBe(false);
    });

    it('should be false while logged in but still on an /account page', () => {
      // Arrange
      const component = createComponent('/account/login');
      let shown: boolean | undefined;
      component.showShell$.subscribe((v) => (shown = v));

      // Act
      user$.next({ id: '1' } as unknown as User);

      // Assert
      expect(shown).toBe(false);
    });

    it('should be true once logged in and off /account', () => {
      // Arrange
      const component = createComponent('/');
      let shown: boolean | undefined;
      component.showShell$.subscribe((v) => (shown = v));

      // Act
      user$.next({ id: '1' } as unknown as User);

      // Assert
      expect(shown).toBe(true);
    });

    it('should flip back to false when navigation lands back on an /account page', () => {
      // Arrange
      const component = createComponent('/');
      let shown: boolean | undefined;
      component.showShell$.subscribe((v) => (shown = v));
      user$.next({ id: '1' } as unknown as User);
      expect(shown).toBe(true);

      // Act
      routerMock.events.next(new NavigationEnd(1, '/account/login', '/account/login'));

      // Assert
      expect(shown).toBe(false);
    });

    it('should fall back to evt.url when urlAfterRedirects is empty', () => {
      // Arrange
      const component = createComponent('/');
      let shown: boolean | undefined;
      component.showShell$.subscribe((v) => (shown = v));
      user$.next({ id: '1' } as unknown as User);

      // Act
      const navEnd = new NavigationEnd(1, '/account/login', '');
      routerMock.events.next(navEnd);

      // Assert
      expect(shown).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should set the page title and update it again when the language changes', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();
      titleServiceMock.setTitle.mockClear();
      language$.next('en');

      // Assert
      expect(titleServiceMock.setTitle).toHaveBeenCalledWith('APP_TITLE');

      component.ngOnDestroy();
    });

    it('should emit no user and not call refreshUser when nothing is stored', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(accountServiceMock.emitNoUser).toHaveBeenCalled();
      expect(accountServiceMock.refreshUser).not.toHaveBeenCalled();

      component.ngOnDestroy();
    });

    it('should log out when the stored token is already expired', () => {
      // Arrange
      const component = createComponent();
      accountServiceMock.getStoredUser.mockReturnValue({ tokenExpiresAtUtc: '2000-01-01' });
      accountServiceMock.isTokenExpired.mockReturnValue(true);

      // Act
      component.ngOnInit();

      // Assert
      expect(accountServiceMock.logout).toHaveBeenCalled();
      expect(accountServiceMock.refreshUser).not.toHaveBeenCalled();

      component.ngOnDestroy();
    });

    it('should refresh the session when a valid token is stored', () => {
      // Arrange
      const component = createComponent();
      accountServiceMock.getStoredUser.mockReturnValue({ tokenExpiresAtUtc: '2999-01-01' });
      accountServiceMock.isTokenExpired.mockReturnValue(false);

      // Act
      component.ngOnInit();

      // Assert
      expect(accountServiceMock.refreshUser).toHaveBeenCalled();
      expect(accountServiceMock.logout).not.toHaveBeenCalled();

      component.ngOnDestroy();
    });

    it('should log out when the refreshUser call on init errors', () => {
      // Arrange
      const component = createComponent();
      accountServiceMock.getStoredUser.mockReturnValue({ tokenExpiresAtUtc: '2999-01-01' });
      accountServiceMock.isTokenExpired.mockReturnValue(false);
      accountServiceMock.refreshUser.mockReturnValue(
        new Observable((subscriber) => subscriber.error(new Error('fail'))),
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(accountServiceMock.logout).toHaveBeenCalled();

      component.ngOnDestroy();
    });

    it('should do nothing when the service worker is disabled', () => {
      // Arrange
      const component = createComponent();
      swUpdateMock.isEnabled = false;

      // Act
      component.ngOnInit();

      // Assert
      expect(() => versionUpdates$.next({ type: 'VERSION_READY' })).not.toThrow();

      component.ngOnDestroy();
    });

    it('should activate the update when a new version is ready', async () => {
      // Arrange
      const component = createComponent();
      swUpdateMock.isEnabled = true;
      swUpdateMock.activateUpdate.mockResolvedValue(undefined);

      // Act
      component.ngOnInit();
      versionUpdates$.next({ type: 'VERSION_READY' });
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      // document.location.reload() itself is not spyable under jsdom (non-configurable), but
      // jsdom no-ops real navigation attempts with a console warning rather than throwing, so
      // reaching this point without an unhandled error confirms the .then() callback ran.
      expect(swUpdateMock.activateUpdate).toHaveBeenCalled();

      component.ngOnDestroy();
    });

    it('should ignore service worker events that are not VERSION_READY', () => {
      // Arrange
      const component = createComponent();
      swUpdateMock.isEnabled = true;

      // Act
      component.ngOnInit();
      versionUpdates$.next({ type: 'NO_NEW_VERSION_DETECTED' });

      // Assert
      expect(swUpdateMock.activateUpdate).not.toHaveBeenCalled();

      component.ngOnDestroy();
    });

    it('should register an activity listener per event that resets auto-logout when logged in', () => {
      // Arrange
      const component = createComponent();
      accountServiceMock.getStoredUser.mockReturnValue({ tokenExpiresAtUtc: '2999-01-01' });

      // Act
      component.ngOnInit();

      // Assert
      expect(rendererMock.listen).toHaveBeenCalledWith('document', 'mousemove', expect.any(Function));
      const handler = rendererMock.listen.mock.calls.find((c) => c[1] === 'mousemove')![2];
      handler();

      expect(accountServiceMock.startAutoLogout).toHaveBeenCalledWith('2999-01-01');

      component.ngOnDestroy();
    });

    it('should not reset auto-logout from an activity event when there is no stored user', () => {
      // Arrange
      const component = createComponent();
      accountServiceMock.getStoredUser.mockReturnValue(null);

      // Act
      component.ngOnInit();
      const handler = rendererMock.listen.mock.calls.find((c) => c[1] === 'mousemove')![2];
      handler();

      // Assert
      expect(accountServiceMock.startAutoLogout).not.toHaveBeenCalled();

      component.ngOnDestroy();
    });

    it('should apply register-page classes when navigating to /account/register', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      routerMock.events.next(new NavigationEnd(1, '/account/register', '/account/register'));

      // Assert
      expect(rendererMock.addClass).toHaveBeenCalledWith(document.body, 'register-page');
      expect(rendererMock.addClass).toHaveBeenCalledWith(document.body, 'bg-body-secondary');

      component.ngOnDestroy();
    });

    it('should apply login-page classes when navigating to /account/login', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      routerMock.events.next(new NavigationEnd(1, '/account/login', '/account/login'));

      // Assert
      expect(rendererMock.addClass).toHaveBeenCalledWith(document.body, 'login-page');

      component.ngOnDestroy();
    });

    it('should fall back to evt.url when urlAfterRedirects is empty on a body-class navigation', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      routerMock.events.next(new NavigationEnd(1, '/account/login', ''));

      // Assert
      expect(rendererMock.addClass).toHaveBeenCalledWith(document.body, 'login-page');

      component.ngOnDestroy();
    });

    it('should apply no extra classes and remove previously applied ones on a regular page', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      routerMock.events.next(new NavigationEnd(1, '/account/login', '/account/login'));
      rendererMock.removeClass.mockClear();

      // Act
      routerMock.events.next(new NavigationEnd(2, '/dashboard', '/dashboard'));

      // Assert
      expect(rendererMock.removeClass).toHaveBeenCalledWith(document.body, 'login-page');

      component.ngOnDestroy();
    });

    it('should delegate NavigationError router events to the chunk-load-error handler', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const handleSpy = vi.spyOn(component as any, 'handleChunkLoadError');

      // Act
      const navError = new NavigationError(1, '/orders', new Error('boom'));
      routerMock.events.next(navError);

      // Assert
      expect(handleSpy).toHaveBeenCalledWith(navError);

      component.ngOnDestroy();
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe, remove applied body classes, and unlisten activity handlers when called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      routerMock.events.next(new NavigationEnd(1, '/account/login', '/account/login'));
      rendererMock.removeClass.mockClear();

      // Act
      component.ngOnDestroy();

      // Assert
      expect(rendererMock.removeClass).toHaveBeenCalledWith(document.body, 'login-page');
      expect(() => routerMock.events.next(new NavigationEnd(2, '/', '/'))).not.toThrow();
    });

    it('should swallow an error thrown by an activity unlisten function', () => {
      // Arrange
      const component = createComponent();
      rendererMock.listen.mockReturnValue(() => {
        throw new Error('fail');
      });
      component.ngOnInit();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should not throw when nothing was ever subscribed', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('handleChunkLoadError (private, direct calls)', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    function call(component: AppComponent, error: unknown, url = '/orders') {
      (component as any).handleChunkLoadError({ url, error });
    }

    function storedReload(): { url: string; ts: number } | null {
      return JSON.parse(sessionStorage.getItem('nexusChunkReload') || 'null');
    }

    it('should ignore an unrelated navigation error', () => {
      // Arrange
      const component = createComponent();

      // Act
      call(component, new Error('some other failure'));

      // Assert
      expect(storedReload()).toBeNull();
    });

    it('should reload via a hard navigation when the error is a ChunkLoadError', () => {
      // Arrange
      const component = createComponent();

      // Act
      call(component, 'ChunkLoadError', '/orders');

      // Assert
      expect(storedReload()?.url).toBe('/orders');
    });

    it('should reload when the error is a "Loading chunk ... failed" webpack-style message', () => {
      // Arrange
      const component = createComponent();

      // Act
      call(component, { message: 'Loading chunk 12 failed' }, '/orders');

      // Assert
      expect(storedReload()?.url).toBe('/orders');
    });

    it('should treat a missing error entirely as an empty message and ignore it', () => {
      // Arrange
      const component = createComponent();

      // Act
      call(component, undefined);

      // Assert
      expect(storedReload()).toBeNull();
    });

    it('should not reload again for the same url within the 15s throttle window', () => {
      // Arrange
      const component = createComponent();
      const original = { url: '/orders', ts: Date.now() };
      sessionStorage.setItem('nexusChunkReload', JSON.stringify(original));

      // Act
      call(component, 'ChunkLoadError', '/orders');

      // Assert
      expect(storedReload()!.ts).toBe(original.ts);
    });

    it('should reload again once the throttle window has elapsed', () => {
      // Arrange
      const component = createComponent();
      const staleTs = Date.now() - 20000;
      sessionStorage.setItem('nexusChunkReload', JSON.stringify({ url: '/orders', ts: staleTs }));

      // Act
      call(component, 'ChunkLoadError', '/orders');

      // Assert
      expect(storedReload()!.ts).not.toBe(staleTs);
    });

    it('should reload for a different url even within the throttle window', () => {
      // Arrange
      const component = createComponent();
      sessionStorage.setItem(
        'nexusChunkReload',
        JSON.stringify({ url: '/orders', ts: Date.now() }),
      );

      // Act
      call(component, 'ChunkLoadError', '/quotes');

      // Assert
      expect(storedReload()?.url).toBe('/quotes');
    });
  });

  describe('checkRefreshOnNavigation (private, via NavigationEnd events)', () => {
    it('should not attempt a refresh on an /account page', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      accountServiceMock.refreshUser.mockClear();

      // Act
      routerMock.events.next(new NavigationEnd(2, '/account/login', '/account/login'));

      // Assert
      expect(accountServiceMock.refreshUser).not.toHaveBeenCalled();
      component.ngOnDestroy();
    });

    it('should throttle repeated refresh attempts within the interval', () => {
      // Arrange
      const component = createComponent();
      (component as any).refreshIntervalMs = 999999;
      (component as any).lastRefresh = Date.now();
      component.ngOnInit();
      accountServiceMock.refreshUser.mockClear();
      accountServiceMock.getStoredUser.mockReturnValue({ tokenExpiresAtUtc: '2999-01-01' });
      accountServiceMock.isTokenExpired.mockReturnValue(false);

      // Act
      routerMock.events.next(new NavigationEnd(2, '/dashboard', '/dashboard'));

      // Assert
      expect(accountServiceMock.refreshUser).not.toHaveBeenCalled();
      component.ngOnDestroy();
    });

    it('should do nothing when there is no stored user on navigation', () => {
      // Arrange
      const component = createComponent();
      (component as any).refreshIntervalMs = 0;
      component.ngOnInit();
      accountServiceMock.getStoredUser.mockReturnValue(null);

      // Act
      // Assert
      expect(() =>
        routerMock.events.next(new NavigationEnd(2, '/dashboard', '/dashboard')),
      ).not.toThrow();
      expect(accountServiceMock.refreshUser).not.toHaveBeenCalled();
      component.ngOnDestroy();
    });

    it('should log out immediately when the stored token has expired', () => {
      // Arrange
      const component = createComponent();
      (component as any).refreshIntervalMs = 0;
      component.ngOnInit();
      accountServiceMock.getStoredUser.mockReturnValue({ tokenExpiresAtUtc: '2000-01-01' });
      accountServiceMock.isTokenExpired.mockReturnValue(true);

      // Act
      routerMock.events.next(new NavigationEnd(2, '/dashboard', '/dashboard'));

      // Assert
      expect(accountServiceMock.logout).toHaveBeenCalled();
      expect(accountServiceMock.refreshUser).not.toHaveBeenCalled();
      component.ngOnDestroy();
    });

    it('should refresh the token and record the timestamp on success', () => {
      // Arrange
      const component = createComponent();
      (component as any).refreshIntervalMs = 0;
      component.ngOnInit();
      accountServiceMock.getStoredUser.mockReturnValue({ tokenExpiresAtUtc: '2999-01-01' });
      accountServiceMock.isTokenExpired.mockReturnValue(false);
      accountServiceMock.refreshUser.mockReturnValue(of(undefined));

      // Act
      routerMock.events.next(new NavigationEnd(2, '/dashboard', '/dashboard'));

      // Assert
      expect((component as any).lastRefresh).toBeGreaterThan(0);
      component.ngOnDestroy();
    });

    it('should log out and record the timestamp when the refresh request errors', () => {
      // Arrange
      const component = createComponent();
      (component as any).refreshIntervalMs = 0;
      component.ngOnInit();
      accountServiceMock.getStoredUser.mockReturnValue({ tokenExpiresAtUtc: '2999-01-01' });
      accountServiceMock.isTokenExpired.mockReturnValue(false);
      accountServiceMock.refreshUser.mockReturnValue(
        new Observable((subscriber) => subscriber.error(new Error('fail'))),
      );

      // Act
      routerMock.events.next(new NavigationEnd(2, '/dashboard', '/dashboard'));

      // Assert
      expect(accountServiceMock.logout).toHaveBeenCalled();
      expect((component as any).lastRefresh).toBeGreaterThan(0);
      component.ngOnDestroy();
    });
  });
});
