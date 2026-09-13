import { ChangeDetectorRef, Renderer2 } from '@angular/core';
import { AccountService, PhotoService, User } from '@nexus/core';
import { Subject, of, throwError } from 'rxjs';
import { FeatureFlagService } from '../core/services/feature-flag/feature-flag.service';
import { FeatureToggleKeys } from '../core/models/feature-toggle.model';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let rendererMock: {
    listen: ReturnType<typeof vi.fn>;
    addClass: ReturnType<typeof vi.fn>;
    removeClass: ReturnType<typeof vi.fn>;
  };
  let user$: Subject<User | null>;
  let accountServiceMock: { user$: Subject<User | null>; logout: ReturnType<typeof vi.fn> };
  let photo$: Subject<{ photoPath?: string; userId?: string }>;
  let photoServiceMock: {
    photo$: Subject<{ photoPath?: string; userId?: string }>;
    getPhoto: ReturnType<typeof vi.fn>;
  };
  let featureFlagServiceMock: { isEnabled: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(
    isEnabledImpl: (key: string) => ReturnType<FeatureFlagService['isEnabled']> = () => of(true),
  ): NavbarComponent {
    rendererMock = {
      listen: vi.fn().mockReturnValue(vi.fn()),
      addClass: vi.fn((el: HTMLElement, cls: string) => el.classList.add(cls)),
      removeClass: vi.fn((el: HTMLElement, cls: string) => el.classList.remove(cls)),
    };
    user$ = new Subject();
    accountServiceMock = { user$, logout: vi.fn() };
    photo$ = new Subject();
    photoServiceMock = { photo$, getPhoto: vi.fn() };
    featureFlagServiceMock = { isEnabled: vi.fn(isEnabledImpl) };
    cdrMock = { markForCheck: vi.fn() };

    return new NavbarComponent(
      rendererMock as unknown as Renderer2,
      accountServiceMock as unknown as AccountService,
      photoServiceMock as unknown as PhotoService,
      featureFlagServiceMock as unknown as FeatureFlagService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  beforeEach(() => {
    if (!('createObjectURL' in URL)) {
      (URL as any).createObjectURL = () => '';
    }
    if (!('revokeObjectURL' in URL)) {
      (URL as any).revokeObjectURL = () => {};
    }
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    document.body.className = '';
    document.querySelectorAll('.sidebar-overlay, .app-sidebar, .main-sidebar, .sidebar').forEach((el) => el.remove());
  });

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('feature-flag combined observables', () => {
    function keyedIsEnabled(overrides: Record<string, boolean>) {
      return (key: string) => of(overrides[key] ?? true);
    }

    it('should resolve isAgendaModuleEnabled$ directly from the AgendaModule toggle', () => {
      // Arrange
      const component = createComponent(
        keyedIsEnabled({ [FeatureToggleKeys.AgendaModule]: false }),
      );
      let value: boolean | undefined;

      // Act
      component.isAgendaModuleEnabled$.subscribe((v) => (value = v));

      // Assert
      expect(value).toBe(false);
    });

    it('should return true only when both the fleet module and the alert toggle are enabled', () => {
      // Arrange
      let component = createComponent(keyedIsEnabled({}));
      let value: boolean | undefined;

      // Act
      component.isDriverLicenseAlertEnabled$.subscribe((v) => (value = v));

      // Assert
      expect(value).toBe(true);

      // Act
      component = createComponent(keyedIsEnabled({ [FeatureToggleKeys.FleetModule]: false }));
      component.isDriverLicenseAlertEnabled$.subscribe((v) => (value = v));

      // Assert
      expect(value).toBe(false);
    });

    it('should return false when the vehicle-blocked alert toggle is disabled', () => {
      // Arrange
      const component = createComponent(
        keyedIsEnabled({ [FeatureToggleKeys.VehicleBlockedAlert]: false }),
      );
      let value: boolean | undefined;

      // Act
      component.isVehicleBlockedAlertEnabled$.subscribe((v) => (value = v));

      // Assert
      expect(value).toBe(false);
    });

    it('should return true only when both the finance module and the alert toggle are enabled', () => {
      // Arrange
      let component = createComponent(keyedIsEnabled({}));
      let value: boolean | undefined;

      // Act
      component.isPaymentAlertEnabled$.subscribe((v) => (value = v));

      // Assert
      expect(value).toBe(true);

      // Act
      component = createComponent(keyedIsEnabled({ [FeatureToggleKeys.FinanceModule]: false }));
      component.isPaymentAlertEnabled$.subscribe((v) => (value = v));

      // Assert
      expect(value).toBe(false);
    });

    it('should return false when the stock alert toggle is disabled', () => {
      // Arrange
      const component = createComponent(keyedIsEnabled({ [FeatureToggleKeys.StockAlert]: false }));
      let value: boolean | undefined;

      // Act
      component.isStockAlertEnabled$.subscribe((v) => (value = v));

      // Assert
      expect(value).toBe(false);
    });

    it('should return true only when both the agenda module and the alert toggle are enabled', () => {
      // Arrange
      let component = createComponent(keyedIsEnabled({}));
      let value: boolean | undefined;

      // Act
      component.isUpcomingEventAlertEnabled$.subscribe((v) => (value = v));

      // Assert
      expect(value).toBe(true);

      // Act
      component = createComponent(keyedIsEnabled({ [FeatureToggleKeys.AgendaModule]: false }));
      component.isUpcomingEventAlertEnabled$.subscribe((v) => (value = v));

      // Assert
      expect(value).toBe(false);
    });
  });

  describe('user$', () => {
    it('should expose the account service user stream when the component is created', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.user$).toBe(accountServiceMock.user$);
    });
  });

  describe('toggleFullscreen', () => {
    it('should request fullscreen when not currently in fullscreen', async () => {
      // Arrange
      const component = createComponent();
      const requestFullscreen = vi.fn().mockResolvedValue(undefined);
      (document.documentElement as any).requestFullscreen = requestFullscreen;
      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });

      // Act
      await component.toggleFullscreen();

      // Assert
      expect(requestFullscreen).toHaveBeenCalled();
      expect(component.isFullscreen).toBe(true);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should exit fullscreen when currently in fullscreen', async () => {
      // Arrange
      const component = createComponent();
      const exitFullscreen = vi.fn().mockResolvedValue(undefined);
      (document as any).exitFullscreen = exitFullscreen;
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.documentElement,
        configurable: true,
      });

      // Act
      await component.toggleFullscreen();

      // Assert
      expect(exitFullscreen).toHaveBeenCalled();
      expect(component.isFullscreen).toBe(false);

      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });
    });

    it('should swallow fullscreen errors when requestFullscreen rejects', async () => {
      // Arrange
      const component = createComponent();
      (document.documentElement as any).requestFullscreen = vi.fn().mockRejectedValue(new Error('nope'));
      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true });

      // Act
      // Assert
      await expect(component.toggleFullscreen()).resolves.toBeUndefined();
    });
  });

  describe('ngOnInit', () => {
    it('should apply the photo update when it matches the currently loaded user', () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'u1' } as User;
      photoServiceMock.getPhoto.mockReturnValue(of(new Blob()));
      component.ngOnInit();

      // Act
      photo$.next({ photoPath: 'p.jpg', userId: 'u1' });

      // Assert
      expect(component.data!.photo).toBe('p.jpg');
      expect(photoServiceMock.getPhoto).toHaveBeenCalledWith('Users', 'u1', 'p.jpg');
    });

    it('should ignore a photo update for a different user', () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'u1' } as User;
      component.ngOnInit();

      // Act
      photo$.next({ photoPath: 'p.jpg', userId: 'u2' });

      // Assert
      expect(photoServiceMock.getPhoto).not.toHaveBeenCalled();
    });

    it('should ignore a photo update when there is no photoPath', () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'u1' } as User;
      component.ngOnInit();

      // Act
      photo$.next({ userId: 'u1' });

      // Assert
      expect(photoServiceMock.getPhoto).not.toHaveBeenCalled();
    });

    it('should load the user photo when the account has one', () => {
      // Arrange
      const component = createComponent();
      photoServiceMock.getPhoto.mockReturnValue(of(new Blob()));
      component.ngOnInit();

      // Act
      user$.next({ id: 'u1', photo: 'p.jpg' } as User);

      // Assert
      expect(component.data).toEqual({ id: 'u1', photo: 'p.jpg' });
      expect(photoServiceMock.getPhoto).toHaveBeenCalledWith('Users', 'u1', 'p.jpg');
    });

    it('should fall back to the default avatar when the account has no photo', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      user$.next({ id: 'u1' } as User);

      // Assert
      expect(component.imageUrl).toBe('assets/img/no_profile.png');
    });
  });

  describe('loadUserPhoto (private, via ngOnInit)', () => {
    it('should revoke the previous blob url before creating a new one when the photo changes again', () => {
      // Arrange
      const component = createComponent();
      photoServiceMock.getPhoto.mockReturnValue(of(new Blob()));
      component.ngOnInit();

      // Act
      user$.next({ id: 'u1', photo: 'p1.jpg' } as User);

      // Assert
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();

      // Act
      user$.next({ id: 'u1', photo: 'p2.jpg' } as User);

      // Assert
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
      expect(component.imageUrl).toBe('blob:fake');
    });

    it('should fall back to the default avatar when the photo request errors', () => {
      // Arrange
      const component = createComponent();
      photoServiceMock.getPhoto.mockReturnValue(throwError(() => new Error('fail')));
      component.ngOnInit();

      // Act
      user$.next({ id: 'u1', photo: 'p.jpg' } as User);

      // Assert
      expect(component.imageUrl).toBe('assets/img/no_profile.png');
    });
  });

  describe('ngAfterViewInit', () => {
    it('should apply the initial responsive state and listen for resize when ngAfterViewInit runs', () => {
      // Arrange
      const component = createComponent();
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });

      // Act
      component.ngAfterViewInit();

      // Assert
      expect(document.body.classList.contains('sidebar-collapse')).toBe(false);
      expect(rendererMock.listen).toHaveBeenCalledWith('window', 'resize', expect.any(Function));
    });

    it('should reapply the responsive state when a resize event fires', () => {
      // Arrange
      const component = createComponent();
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });
      component.ngAfterViewInit();
      const resizeHandler = rendererMock.listen.mock.calls[0][2];

      // Act
      resizeHandler({ target: { innerWidth: 500 } });

      // Assert
      expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should revoke the last blob url when ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      photoServiceMock.getPhoto.mockReturnValue(of(new Blob()));
      component.ngOnInit();
      user$.next({ id: 'u1', photo: 'p.jpg' } as User);
      component.ngAfterViewInit();

      // Act
      component.ngOnDestroy();

      // Assert
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
    });

    it('should not throw when there is nothing to clean up', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should swallow an error thrown by the resize unlisten function', () => {
      // Arrange
      const component = createComponent();
      rendererMock.listen.mockReturnValue(() => {
        throw new Error('fail');
      });
      component.ngAfterViewInit();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('onImgError', () => {
    it('should fall back to the default avatar image when onImgError is called', () => {
      // Arrange
      const component = createComponent();
      const img = document.createElement('img');

      // Act
      component.onImgError({ target: img } as unknown as Event);

      // Assert
      expect(img.src).toContain('no_profile.png');
    });
  });

  describe('logout', () => {
    it('should delegate to the account service when logout is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.logout();

      // Assert
      expect(accountServiceMock.logout).toHaveBeenCalled();
    });
  });

  describe('toggleSidebar', () => {
    beforeEach(() => {
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should open the mobile overlay when the sidebar is closed', () => {
      // Arrange
      const component = createComponent();
      Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
      const sidebar = document.createElement('div');
      sidebar.className = 'app-sidebar';
      document.body.appendChild(sidebar);

      // Act
      component.toggleSidebar();

      // Assert
      expect(document.body.classList.contains('sidebar-open')).toBe(true);
      expect(document.querySelector('.sidebar-overlay')).not.toBeNull();
      sidebar.remove();
    });

    it('should close the mobile overlay when the sidebar is open', () => {
      // Arrange
      const component = createComponent();
      Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
      const sidebar = document.createElement('div');
      sidebar.className = 'app-sidebar';
      document.body.appendChild(sidebar);
      component.toggleSidebar();

      // Act
      component.toggleSidebar();

      // Assert
      expect(document.body.classList.contains('sidebar-open')).toBe(false);
      expect(document.body.classList.contains('sidebar-collapse')).toBe(true);
      sidebar.remove();
    });

    it('should toggle the collapse class on desktop and remove any overlay', () => {
      // Arrange
      const component = createComponent();
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });

      // Act
      component.toggleSidebar();

      // Assert
      expect(document.body.classList.contains('sidebar-collapse')).toBe(true);

      // Act
      component.toggleSidebar();

      // Assert
      expect(document.body.classList.contains('sidebar-collapse')).toBe(false);
    });

    it('should remove the overlay when there is no sidebar element and the sidebar is not open', () => {
      // Arrange
      const component = createComponent();
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });

      // Act
      component.toggleSidebar();

      // Assert
      expect(document.querySelector('.sidebar-overlay')).toBeNull();
    });

    it('should close the sidebar when the overlay is clicked', () => {
      // Arrange
      const component = createComponent();
      Object.defineProperty(window, 'innerWidth', { value: 500, configurable: true });
      const sidebar = document.createElement('div');
      sidebar.className = 'app-sidebar';
      document.body.appendChild(sidebar);
      component.toggleSidebar();
      const overlay = document.querySelector('.sidebar-overlay')!;

      // Act
      overlay.dispatchEvent(new Event('click', { cancelable: true }));

      // Assert
      expect(document.body.classList.contains('sidebar-open')).toBe(false);
      sidebar.remove();
    });
  });

  describe('ensureOverlay (private)', () => {
    it('should do nothing when an overlay already exists', () => {
      // Arrange
      const component = createComponent();
      (component as any).ensureOverlay();
      const first = (component as any).overlayEl;

      // Act
      (component as any).ensureOverlay();

      // Assert
      expect((component as any).overlayEl).toBe(first);
      document.querySelectorAll('.sidebar-overlay').forEach((el) => el.remove());
    });

    it('should append the overlay to .app-wrapper when it is present', () => {
      // Arrange
      const component = createComponent();
      const wrapper = document.createElement('div');
      wrapper.className = 'app-wrapper';
      document.body.appendChild(wrapper);

      // Act
      (component as any).ensureOverlay();

      // Assert
      expect(wrapper.querySelector('.sidebar-overlay')).not.toBeNull();
      wrapper.remove();
    });
  });

  describe('hideOverlay (private, via toggleSidebar)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should do nothing when there is no overlay', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => (component as any).hideOverlay()).not.toThrow();
    });

    it('should remove the overlay after the delay when it is still not visible', () => {
      // Arrange
      const component = createComponent();
      (component as any).ensureOverlay();
      const overlay = (component as any).overlayEl as HTMLElement;
      document.body.appendChild(overlay);

      // Act
      (component as any).hideOverlay();
      vi.advanceTimersByTime(500);

      // Assert
      expect((component as any).overlayEl).toBeNull();
    });

    it('should leave the overlay alone if it became visible again before the delay elapses', () => {
      // Arrange
      const component = createComponent();
      (component as any).ensureOverlay();
      const overlay = (component as any).overlayEl as HTMLElement;
      document.body.appendChild(overlay);

      // Act
      (component as any).hideOverlay();
      overlay.classList.add('visible');
      vi.advanceTimersByTime(500);

      // Assert
      expect((component as any).overlayEl).toBe(overlay);
      overlay.remove();
    });
  });

  describe('removeOverlay (private)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should do nothing when there is no overlay', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => (component as any).removeOverlay()).not.toThrow();
    });

    it('should remove the overlay immediately when forceRemove is true', () => {
      // Arrange
      const component = createComponent();
      (component as any).ensureOverlay();
      const overlay = (component as any).overlayEl as HTMLElement;
      document.body.appendChild(overlay);

      // Act
      (component as any).removeOverlay(true);

      // Assert
      expect(overlay.parentElement).toBeNull();
      expect((component as any).overlayEl).toBeNull();
    });

    it('should remove the overlay after a fallback timeout when the transition does not end', () => {
      // Arrange
      const component = createComponent();
      (component as any).ensureOverlay();
      const overlay = (component as any).overlayEl as HTMLElement;
      document.body.appendChild(overlay);

      // Act
      (component as any).removeOverlay();
      vi.advanceTimersByTime(800);

      // Assert
      expect(overlay.parentElement).toBeNull();
      expect((component as any).overlayEl).toBeNull();
    });

    it('should remove the overlay via the transitionend event when it fires before the fallback', () => {
      // Arrange
      const component = createComponent();
      (component as any).ensureOverlay();
      const overlay = (component as any).overlayEl as HTMLElement;
      document.body.appendChild(overlay);

      // Act
      (component as any).removeOverlay();
      overlay.dispatchEvent(new Event('transitionend'));

      // Assert
      expect(overlay.parentElement).toBeNull();
      expect((component as any).overlayEl).toBeNull();
    });

    it('should skip unlisten when there is no click listener registered', () => {
      // Arrange
      const component = createComponent();
      (component as any).ensureOverlay();
      const overlay = (component as any).overlayEl as HTMLElement;
      document.body.appendChild(overlay);
      (component as any).overlayClickUnlisten = null;

      // Act
      // Assert
      expect(() => (component as any).removeOverlay(true)).not.toThrow();
      expect((component as any).overlayEl).toBeNull();
    });

    it('should not throw when the overlay element has already been detached from the DOM', () => {
      // Arrange
      const component = createComponent();
      (component as any).ensureOverlay();
      const overlay = (component as any).overlayEl as HTMLElement;
      overlay.parentElement?.removeChild(overlay);

      // Act
      // Assert
      expect(() => (component as any).removeOverlay(true)).not.toThrow();
      expect((component as any).overlayEl).toBeNull();
      expect(overlay.parentElement).toBeNull();
    });

    it('should leave overlayEl untouched when it was replaced before the removal completes', () => {
      // Arrange
      const component = createComponent();
      (component as any).ensureOverlay();
      const overlay = (component as any).overlayEl as HTMLElement;
      document.body.appendChild(overlay);
      const replacement = document.createElement('div');

      // Act
      (component as any).removeOverlay();
      (component as any).overlayEl = replacement;

      overlay.dispatchEvent(new Event('transitionend'));

      // Assert
      expect((component as any).overlayEl).toBe(replacement);
      expect(overlay.parentElement).toBeNull();
    });

    it('should leave overlayEl untouched via the fallback timeout when it was replaced first', () => {
      // Arrange
      const component = createComponent();
      (component as any).ensureOverlay();
      const overlay = (component as any).overlayEl as HTMLElement;
      document.body.appendChild(overlay);
      const replacement = document.createElement('div');

      // Act
      (component as any).removeOverlay();
      (component as any).overlayEl = replacement;

      vi.advanceTimersByTime(800);

      // Assert
      expect((component as any).overlayEl).toBe(replacement);
    });
  });
});
