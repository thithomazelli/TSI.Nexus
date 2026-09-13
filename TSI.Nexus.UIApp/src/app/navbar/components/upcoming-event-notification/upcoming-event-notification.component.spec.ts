import { ChangeDetectorRef } from '@angular/core';
import { BehaviorSubject, of, Subject } from 'rxjs';
import {
  AccountService,
  AgendaEvent,
  AlertConfigKeys,
  AlertConfigService,
  EventService,
  ModalService,
} from '@nexus/core';
import { UpcomingEventNotificationComponent } from './upcoming-event-notification.component';

describe('UpcomingEventNotificationComponent', () => {
  let user$: BehaviorSubject<{ id?: string } | null>;
  let eventChanged$: Subject<void>;
  let eventServiceMock: { getByUserId: ReturnType<typeof vi.fn>; eventChanged$: Subject<void> };
  let alertConfigServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let accountServiceMock: { user$: BehaviorSubject<{ id?: string } | null> };
  let modalServiceMock: { showTemplateModal: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): UpcomingEventNotificationComponent {
    user$ = new BehaviorSubject<{ id?: string } | null>(null);
    eventChanged$ = new Subject();
    eventServiceMock = { getByUserId: vi.fn().mockReturnValue(of({ data: [] })), eventChanged$ };
    alertConfigServiceMock = { getAll: vi.fn().mockReturnValue(of({ data: [] })) };
    accountServiceMock = { user$ };
    modalServiceMock = { showTemplateModal: vi.fn() };
    routerMock = { navigateByUrl: vi.fn() };
    cdrMock = { markForCheck: vi.fn() };

    return new UpcomingEventNotificationComponent(
      eventServiceMock as unknown as EventService,
      alertConfigServiceMock as unknown as AlertConfigService,
      accountServiceMock as unknown as AccountService,
      modalServiceMock as unknown as ModalService,
      routerMock as unknown as any,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('load (via ngOnInit)', () => {
    it('should fetch the current user events, filter them within the alert threshold and mark for check when ngOnInit is called', () => {
      // Arrange
      const now = new Date(2024, 2, 5, 12, 0, 0);
      vi.useFakeTimers();
      vi.setSystemTime(now);
      const withinThreshold = new Date(2024, 2, 6, 12, 0, 0);
      const outsideThreshold = new Date(2024, 2, 10, 12, 0, 0);
      const events = [
        { id: 'e1', startDate: outsideThreshold },
        { id: 'e2', startDate: withinThreshold },
        { id: 'e3', startDate: undefined },
      ] as AgendaEvent[];
      const component = createComponent();
      eventServiceMock.getByUserId.mockReturnValue(of({ data: events }));
      alertConfigServiceMock.getAll.mockReturnValue(
        of({ data: [{ key: AlertConfigKeys.UpcomingEventReminder, enabled: true, thresholdDays: 2 }] }),
      );

      // Act
      component.ngOnInit();
      user$.next({ id: 'u1' });

      // Assert
      expect(eventServiceMock.getByUserId).toHaveBeenCalledWith('u1');
      expect(component.upcomingEvents.map((e) => e.id)).toEqual(['e2']);
      expect(component.total).toBe(1);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should clear events and mark for check when the reminder alert config is disabled', () => {
      // Arrange
      const component = createComponent();
      const events = [{ id: 'e1', startDate: new Date() }] as AgendaEvent[];
      eventServiceMock.getByUserId.mockReturnValue(of({ data: events }));
      alertConfigServiceMock.getAll.mockReturnValue(
        of({ data: [{ key: AlertConfigKeys.UpcomingEventReminder, enabled: false }] }),
      );

      // Act
      component.ngOnInit();
      user$.next({ id: 'u1' });

      // Assert
      expect(component.upcomingEvents).toEqual([]);
      expect(component.total).toBe(0);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should skip fetching events when the current user has no id', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();
      user$.next({});

      // Assert
      expect(eventServiceMock.getByUserId).not.toHaveBeenCalled();
      expect(component.upcomingEvents).toEqual([]);
      expect(component.total).toBe(0);
    });

    it('should reload the events when eventChanged$ emits', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      user$.next({ id: 'u1' });
      expect(eventServiceMock.getByUserId).toHaveBeenCalledTimes(1);

      // Act
      eventChanged$.next();

      // Assert
      expect(eventServiceMock.getByUserId).toHaveBeenCalledTimes(2);
    });
  });

  describe('showBadge', () => {
    it('should show the badge only when there is at least one upcoming event', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(component.showBadge).toBe(false);

      component.total = 1;
      expect(component.showBadge).toBe(true);
    });
  });

  it('should open the event details modal in edit mode when openEvent is called', () => {
    // Arrange
    const component = createComponent();
    const event = { id: 'e1' } as AgendaEvent;

    // Act
    component.openEvent(event);

    // Assert
    expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(expect.anything(), {
      isEdit: true,
      data: event,
    });
  });

  it('should navigate to the agenda filtered to the current user when onSeeAll is called', () => {
    // Arrange
    const component = createComponent();

    // Act
    component.onSeeAll();

    // Assert
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/agenda?onlyMine=true');
  });

  it('should not throw when ngOnDestroy is called', () => {
    // Arrange
    const component = createComponent();

    // Act / Assert
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
