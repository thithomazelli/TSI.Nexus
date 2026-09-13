import { ChangeDetectorRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { AccountService, PhotoService, User, UserService, WebApiResponse } from '@nexus/core';
import { FeatureFlagService } from '../../../core/services/feature-flag/feature-flag.service';
import { UserDetailsPageComponent } from './user-details-page.component';

describe('UserDetailsPageComponent', () => {
  let paramMap$: Subject<{ get: (key: string) => string | null }>;
  let activatedRouteMock: { paramMap: Subject<{ get: (key: string) => string | null }> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let photoServiceMock: { photo$: Subject<{ photoPath: string; userId?: string }> };
  let userServiceMock: { getById: ReturnType<typeof vi.fn> };
  let accountServiceMock: { user$: Subject<User | null> };
  let featureFlagServiceMock: { isEnabled: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): UserDetailsPageComponent {
    paramMap$ = new Subject();
    activatedRouteMock = { paramMap: paramMap$ };
    routerMock = { navigateByUrl: vi.fn() };
    photoServiceMock = { photo$: new Subject() };
    userServiceMock = { getById: vi.fn().mockReturnValue(new Subject()) };
    accountServiceMock = { user$: new Subject() };
    featureFlagServiceMock = { isEnabled: vi.fn().mockReturnValue(of(true)) };
    cdrMock = { markForCheck: vi.fn() };

    TestBed.configureTestingModule({});
    return TestBed.runInInjectionContext(
      () =>
        new UserDetailsPageComponent(
          activatedRouteMock as unknown as ActivatedRoute,
          routerMock as unknown as Router,
          photoServiceMock as unknown as PhotoService,
          userServiceMock as unknown as UserService,
          accountServiceMock as unknown as AccountService,
          featureFlagServiceMock as unknown as FeatureFlagService,
          cdrMock as unknown as ChangeDetectorRef,
        ),
    );
  }

  function paramMap(id: string | null) {
    return { get: (key: string) => (key === 'id' ? id : null) };
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  it('should combine the group and entity flags when isAgendaEnabled is called', () => {
    // Arrange
    const component = createComponent();

    // Act
    // Assert
    expect(component.isAgendaEnabled()).toBe(true);
  });

  describe('ngOnInit', () => {
    it('should set isEdit to false when creating a new user', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      paramMap$.next(paramMap('new'));

      // Assert
      expect(component.isEdit).toBe(false);
      expect(component.data).toBeNull();
    });

    it('should load an existing user and mark for check when ngOnInit runs', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<User>>();
      userServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      paramMap$.next(paramMap('u1'));

      // Assert
      expect(component.isEdit).toBe(true);
      expect(component.loading).toBe(true);
      expect(userServiceMock.getById).toHaveBeenCalledWith('u1');

      const data = { id: 'u1' } as User;
      response$.next({ data } as WebApiResponse<User>);

      expect(component.loading).toBe(false);
      expect(component.data).toBe(data);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should navigate to not-found when the user does not exist', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<User>>();
      userServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      paramMap$.next(paramMap('missing'));
      response$.next({ data: null } as unknown as WebApiResponse<User>);

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
    });

    it('should update the loaded user photo and mark for check when photo$ emits', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<User>>();
      userServiceMock.getById.mockReturnValue(response$);

      component.ngOnInit();
      paramMap$.next(paramMap('u1'));
      response$.next({ data: { id: 'u1' } as User } as WebApiResponse<User>);
      cdrMock.markForCheck.mockClear();

      // Act
      photoServiceMock.photo$.next({ photoPath: 'photos/u1.jpg', userId: 'u1' });

      // Assert
      expect(component.data?.photo).toBe('photos/u1.jpg');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should ignore a photo$ emission when it has no photoPath', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<User>>();
      userServiceMock.getById.mockReturnValue(response$);

      component.ngOnInit();
      paramMap$.next(paramMap('u1'));
      response$.next({ data: { id: 'u1' } as User } as WebApiResponse<User>);

      // Act
      photoServiceMock.photo$.next({ photoPath: '', userId: 'u1' });

      // Assert
      expect(component.data?.photo).toBeUndefined();
    });

    it('should navigate to not-found, stop loading and mark for check when the request errors', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<User>>();
      userServiceMock.getById.mockReturnValue(response$);

      // Act
      component.ngOnInit();
      paramMap$.next(paramMap('u1'));
      response$.error(new Error('fail'));

      // Assert
      expect(component.loading).toBe(false);
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/not-found');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should set isOwnProfile and mark for check when the current account matches the viewed user', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      paramMap$.next(paramMap('u1'));

      // Act
      accountServiceMock.user$.next({ id: 'u1' } as User);
      expect(component.isOwnProfile).toBe(true);
      expect(cdrMock.markForCheck).toHaveBeenCalled();

      accountServiceMock.user$.next({ id: 'other' } as User);

      // Assert
      expect(component.isOwnProfile).toBe(false);
    });
  });

  it('should not throw when ngOnDestroy is called', () => {
    // Arrange
    const component = createComponent();

    // Act
    // Assert
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  describe('subscription teardown', () => {
    it('should stop reacting to paramMap, photo$ and user$ when ngOnDestroy has been called', () => {
      // Arrange
      const component = createComponent();
      const response$ = new Subject<WebApiResponse<User>>();
      userServiceMock.getById.mockReturnValue(response$);

      component.ngOnInit();
      paramMap$.next(paramMap('u1'));
      response$.next({ data: { id: 'u1' } as User } as WebApiResponse<User>);
      component.ngOnDestroy();

      // Act
      // None of these should throw (no live subscribers) and none should mutate state anymore.
      paramMap$.next(paramMap('u2'));
      photoServiceMock.photo$.next({ photoPath: 'photos/u2.jpg', userId: 'u2' });
      accountServiceMock.user$.next({ id: 'u1' } as User);

      // Assert
      expect(component.id).toBe('u1');
      expect(component.data?.photo).toBeUndefined();
      expect(component.isOwnProfile).toBe(false);
    });
  });
});
