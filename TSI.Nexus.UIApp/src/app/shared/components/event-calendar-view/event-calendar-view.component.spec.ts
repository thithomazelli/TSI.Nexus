import { ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';
import { AgendaEvent, TranslationService } from '@nexus/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { EventCalendarViewComponent } from './event-calendar-view.component';

describe('EventCalendarViewComponent', () => {
  let language$: Subject<string>;
  let translationServiceMock: { current: string; language$: Subject<string> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): EventCalendarViewComponent {
    language$ = new Subject();
    translationServiceMock = { current: 'pt-BR', language$ };
    cdrMock = { markForCheck: vi.fn() };

    return new EventCalendarViewComponent(
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  it('should register the list plugin backing the headerToolbar\'s listWeek button', () => {
    // Arrange
    const component = createComponent();

    // Act / Assert
    expect(component.calendarOptions.plugins).toEqual([
      dayGridPlugin,
      timeGridPlugin,
      listPlugin,
      interactionPlugin,
    ]);
  });

  describe('ngOnInit', () => {
    it('should apply the current locale without marking for check on initial setup', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect((component.calendarOptions.locale as { code: string }).code).toBe('pt-br');
      expect(cdrMock.markForCheck).not.toHaveBeenCalled();
    });

    it('should re-apply the locale and mark for check when the language changes afterwards', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      language$.next('en');

      // Assert
      expect(component.calendarOptions.locale).toBe('en');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should resolve the Spanish locale when the language changes to es', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      language$.next('es');

      // Assert
      expect((component.calendarOptions.locale as { code: string }).code).toBe('es');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should map the initial events into calendar events when ngOnInit is called', () => {
      // Arrange
      const component = createComponent();
      component.events = [
        {
          id: 'e1',
          title: 'Evento',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-02'),
          eventTypeColor: '#fff',
        } as unknown as AgendaEvent,
      ];

      // Act
      component.ngOnInit();

      // Assert
      expect(component.calendarOptions.events).toEqual([
        expect.objectContaining({ id: 'e1', title: 'Evento' }),
      ]);
    });
  });

  describe('ngOnChanges', () => {
    it('should re-apply the events when the events input changes after the first change', () => {
      // Arrange
      const component = createComponent();
      component.events = [{ id: 'e2', title: 'Novo evento' } as unknown as AgendaEvent];

      // Act
      component.ngOnChanges({ events: { firstChange: false } as never });

      // Assert
      expect(component.calendarOptions.events).toEqual([
        expect.objectContaining({ id: 'e2', title: 'Novo evento' }),
      ]);
    });

    it('should do nothing when the events change is the first change', () => {
      // Arrange
      const component = createComponent();
      const before = component.calendarOptions.events;

      // Act
      component.ngOnChanges({ events: { firstChange: true } as never });

      // Assert
      expect(component.calendarOptions.events).toBe(before);
    });

    it('should do nothing when a different input changes', () => {
      // Arrange
      const component = createComponent();
      const before = component.calendarOptions.events;

      // Act
      component.ngOnChanges({});

      // Assert
      expect(component.calendarOptions.events).toBe(before);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject when ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const destroy$ = (component as unknown as { _destroy$: Subject<void> })._destroy$;
      const nextSpy = vi.spyOn(destroy$, 'next');
      const completeSpy = vi.spyOn(destroy$, 'complete');

      // Act
      component.ngOnDestroy();

      // Assert
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should stop reacting to language changes after ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.ngOnDestroy();
      cdrMock.markForCheck.mockClear();

      // Act
      language$.next('en');

      // Assert
      expect(cdrMock.markForCheck).not.toHaveBeenCalled();
    });
  });

  describe('event callbacks', () => {
    it('should emit eventClicked with the original event when eventClick fires', () => {
      // Arrange
      const component = createComponent();
      const original = { id: 'e1' } as AgendaEvent;
      const emitSpy = vi.spyOn(component.eventClicked, 'emit');
      const arg = { event: { extendedProps: { original } } } as never;

      // Act
      component.calendarOptions.eventClick!(arg);

      // Assert
      expect(emitSpy).toHaveBeenCalledWith(original);
    });

    it('should not emit eventClicked when the clicked event has no original payload', () => {
      // Arrange
      const component = createComponent();
      const emitSpy = vi.spyOn(component.eventClicked, 'emit');
      const arg = { event: { extendedProps: {} } } as never;

      // Act
      component.calendarOptions.eventClick!(arg);

      // Assert
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit rangeSelected and unselect the calendar when select fires', () => {
      // Arrange
      const component = createComponent();
      const start = new Date('2026-01-01');
      const end = new Date('2026-01-02');
      const emitSpy = vi.spyOn(component.rangeSelected, 'emit');
      const unselect = vi.fn();
      component.calendarComponent = { getApi: () => ({ unselect }) } as never;
      const arg = { start, end } as never;

      // Act
      component.calendarOptions.select!(arg);

      // Assert
      expect(emitSpy).toHaveBeenCalledWith({ start, end });
      expect(unselect).toHaveBeenCalled();
    });
  });
});
