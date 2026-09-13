import { Router } from '@angular/router';
import {
  AccountService,
  AgendaEvent,
  EventService,
  ModalService,
  NotificationService,
  ResponseStatus,
  TranslationService,
  WebApiResponse,
} from '@nexus/core';
import { ChangeDetectorRef } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { EventListComponent } from './event-list.component';

describe('EventListComponent', () => {
  let eventServiceMock: {
    getAll: ReturnType<typeof vi.fn>;
    getByUserId: ReturnType<typeof vi.fn>;
    getByEntityId: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    eventChanged$: Subject<void>;
  };
  let accountServiceMock: { user$: Subject<{ id: string } | null> };
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn>; language$: Subject<string> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): EventListComponent {
    eventServiceMock = {
      getAll: vi.fn().mockReturnValue(new Subject()),
      getByUserId: vi.fn().mockReturnValue(new Subject()),
      getByEntityId: vi.fn().mockReturnValue(new Subject()),
      delete: vi.fn(),
      eventChanged$: new Subject(),
    };
    accountServiceMock = { user$: new Subject() };
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key), language$: new Subject() };
    routerMock = { navigateByUrl: vi.fn() };
    cdrMock = { markForCheck: vi.fn() };

    return new EventListComponent(
      eventServiceMock as unknown as EventService,
      accountServiceMock as unknown as AccountService,
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      translationServiceMock as unknown as TranslationService,
      routerMock as unknown as Router,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should rebuild columns and mark for check when the language changes', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const before = component.columnDefs;

      // Act
      translationServiceMock.language$.next('en');

      // Assert
      expect(before.length).toBeGreaterThan(0);
      expect(component.columnDefs).not.toBe(before);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should load events and mark for check when the current user resolves', () => {
      // Arrange
      const component = createComponent();
      eventServiceMock.getAll.mockReturnValue(of({ data: [{ id: 'e1' }] } as WebApiResponse<AgendaEvent[]>));
      component.ngOnInit();

      // Act
      accountServiceMock.user$.next({ id: 'u1' });

      // Assert
      expect(component.events).toEqual([{ id: 'e1' }]);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should not throw when the logged-out user (no id) resolves', () => {
      // Arrange
      const component = createComponent();
      eventServiceMock.getAll.mockReturnValue(of({ data: [] } as unknown as WebApiResponse<AgendaEvent[]>));
      component.ngOnInit();

      // Act
      // Assert
      expect(() => accountServiceMock.user$.next(null)).not.toThrow();
    });

    it('should reload when eventChanged$ emits', () => {
      // Arrange
      const component = createComponent();
      eventServiceMock.getAll.mockReturnValue(of({ data: [] } as unknown as WebApiResponse<AgendaEvent[]>));
      component.ngOnInit();
      accountServiceMock.user$.next({ id: 'u1' });
      eventServiceMock.getAll.mockClear();

      // Act
      eventServiceMock.eventChanged$.next();

      // Assert
      expect(eventServiceMock.getAll).toHaveBeenCalled();
    });

    it('should stop reacting to updates when the component is destroyed', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.ngOnDestroy();
      eventServiceMock.getAll.mockClear();

      // Act
      accountServiceMock.user$.next({ id: 'u1' });
      eventServiceMock.eventChanged$.next();

      // Assert
      expect(eventServiceMock.getAll).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should reload when entity changes after the first change', () => {
      // Arrange
      const component = createComponent();
      eventServiceMock.getAll.mockReturnValue(of({ data: [] } as unknown as WebApiResponse<AgendaEvent[]>));

      // Act
      component.ngOnChanges({
        entity: { firstChange: false, currentValue: 'Trip' } as never,
      });

      // Assert
      expect(eventServiceMock.getAll).toHaveBeenCalled();
    });

    it('should reload when entityId changes after the first change', () => {
      // Arrange
      const component = createComponent();
      eventServiceMock.getAll.mockReturnValue(of({ data: [] } as unknown as WebApiResponse<AgendaEvent[]>));

      // Act
      component.ngOnChanges({
        entityId: { firstChange: false, currentValue: 't1' } as never,
      });

      // Assert
      expect(eventServiceMock.getAll).toHaveBeenCalled();
    });

    it('should not reload on the very first change', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnChanges({
        entity: { firstChange: true, currentValue: 'Trip' } as never,
      });

      // Assert
      expect(eventServiceMock.getAll).not.toHaveBeenCalled();
    });

    it('should do nothing when neither entity nor entityId nor extraEvents changed', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() =>
        component.ngOnChanges({ compact: { firstChange: false } as never }),
      ).not.toThrow();
      expect(eventServiceMock.getAll).not.toHaveBeenCalled();
    });

    it('should merge extraEvents into the row data, replacing prior read-only rows, and mark for check after the first change', () => {
      // Arrange
      const component = createComponent();
      component.events = [
        { id: 'real1', readOnly: false } as AgendaEvent,
        { id: 'ro-old', readOnly: true } as AgendaEvent,
      ];
      component.extraEvents = [{ id: 'ro-new', readOnly: true } as AgendaEvent];

      // Act
      component.ngOnChanges({
        extraEvents: { firstChange: false, currentValue: component.extraEvents } as never,
      });

      // Assert
      expect(component.events).toEqual([
        { id: 'real1', readOnly: false },
        { id: 'ro-new', readOnly: true },
      ]);
      expect(component.rowData).toBe(component.events);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should not touch events on the first extraEvents change', () => {
      // Arrange
      const component = createComponent();
      const original = component.events;

      // Act
      component.ngOnChanges({
        extraEvents: { firstChange: true, currentValue: [] } as never,
      });

      // Assert
      expect(component.events).toBe(original);
    });
  });

  describe('toggleFilters', () => {
    it('should flip filtersOpen when toggleFilters is called', () => {
      // Arrange
      const component = createComponent();
      expect(component.filtersOpen).toBe(false);

      // Act
      component.toggleFilters();

      // Assert
      expect(component.filtersOpen).toBe(true);

      // Act
      component.toggleFilters();

      // Assert
      expect(component.filtersOpen).toBe(false);
    });
  });

  describe('refresh', () => {
    it('should reload and notify when refresh succeeds', () => {
      // Arrange
      const component = createComponent();
      eventServiceMock.getAll.mockReturnValue(
        of({ data: [], status: ResponseStatus.Success, message: 'OK' } as unknown as WebApiResponse<AgendaEvent[]>),
      );

      // Act
      component.refresh();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Success, 'OK');
    });
  });

  it('should do nothing when noop is called', () => {
    // Arrange
    const component = createComponent();

    // Act
    // Assert
    expect(() => component.noop()).not.toThrow();
  });

  describe('openModal', () => {
    it('should navigate to the trip when the clicked row is a read-only trip event', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.openModal({ data: { readOnly: true, tripId: 't1' } });

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/trips/t1');
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
    });

    it('should open the details modal when the clicked row is a normal row', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.openModal({ isEdit: true, data: { id: 'e1' } });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ isEdit: true, data: { id: 'e1' } }),
      );
    });

    it('should open the create modal when no initialState is given at all', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.openModal(undefined);

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ isEdit: false, data: null, prefillStart: null, prefillEnd: null }),
      );
    });

    it('should lock the link field to the embedding entity when adding from an entity tab', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'trip';
      component.entityId = 't1';
      component.entityLabel = 'Viagem V-1';

      // Act
      component.openModal({ isEdit: false, data: null });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          lockedLinkField: 'tripId',
          lockedLinkId: 't1',
          lockedLinkLabel: 'Viagem V-1',
        }),
      );
    });

    it('should not lock the link field when editing an existing event', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'trip';
      component.entityId = 't1';

      // Act
      component.openModal({ isEdit: true, data: { id: 'e1' } });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ lockedLinkField: null, lockedLinkId: null, lockedLinkLabel: null }),
      );
    });

    it('should not lock the link field when the entity is user', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'user';
      component.entityId = 'u1';

      // Act
      component.openModal({ isEdit: false, data: null });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ lockedLinkField: null }),
      );
    });
  });

  describe('onRangeSelected', () => {
    it('should open the create modal prefilled with the selected range when onRangeSelected is called', () => {
      // Arrange
      const component = createComponent();
      const start = new Date(2024, 0, 1);
      const end = new Date(2024, 0, 2);

      // Act
      component.onRangeSelected({ start, end });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ isEdit: false, prefillStart: start, prefillEnd: end }),
      );
    });
  });

  describe('deleteEvent', () => {
    it('should do nothing when the event is read-only', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.deleteEvent({ id: 'e1', readOnly: true } as AgendaEvent);

      // Assert
      expect(eventServiceMock.delete).not.toHaveBeenCalled();
    });

    it('should remove the event from the list, notify, and mark for check when deletion succeeds', () => {
      // Arrange
      const component = createComponent();
      component.events = [{ id: 'e1' } as AgendaEvent, { id: 'e2' } as AgendaEvent];
      eventServiceMock.delete.mockReturnValue(
        of({ message: 'Removido', status: ResponseStatus.Success } as WebApiResponse<AgendaEvent>),
      );

      // Act
      component.deleteEvent({ id: 'e1' } as AgendaEvent);

      // Assert
      expect(component.events).toEqual([{ id: 'e2' }]);
      expect(component.rowData).toBe(component.events);
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Removido',
        ResponseStatus.Success,
      );
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('load', () => {
    it('should append extraEvents to the loaded events and mark for check when load is called', () => {
      // Arrange
      const component = createComponent();
      component.extraEvents = [{ id: 'ro1', readOnly: true } as AgendaEvent];
      eventServiceMock.getAll.mockReturnValue(
        of({ data: [{ id: 'e1' }] } as WebApiResponse<AgendaEvent[]>),
      );

      // Act
      component.load();

      // Assert
      expect(component.events).toEqual([{ id: 'e1' }, { id: 'ro1', readOnly: true }]);
      expect(component.loading).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      eventServiceMock.getAll.mockReturnValue(of({} as WebApiResponse<AgendaEvent[]>));

      // Act
      component.load();

      // Assert
      expect(component.events).toEqual([]);
    });

    it('should not notify on a normal (non-refresh) load', () => {
      // Arrange
      const component = createComponent();
      eventServiceMock.getAll.mockReturnValue(
        of({ data: [], status: ResponseStatus.Success, message: 'OK' } as unknown as WebApiResponse<AgendaEvent[]>),
      );

      // Act
      component.load();

      // Assert
      expect(notificationServiceMock.showMessage).not.toHaveBeenCalled();
    });

    it('should set loading to false and mark for check without throwing when the request errors', () => {
      // Arrange
      const component = createComponent();
      eventServiceMock.getAll.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      // Assert
      expect(() => component.load()).not.toThrow();
      expect(component.loading).toBe(false);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should do nothing when resolveRequest has nothing to fetch', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'user';
      component.entityId = null;

      // Act
      component.load();

      // Assert
      expect(component.loading).toBe(false);
      expect(eventServiceMock.getByUserId).not.toHaveBeenCalled();
    });
  });

  describe('resolveRequest (via load)', () => {
    it('should fetch by user id when the entity is user', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'user';
      component.entityId = 'u1';

      // Act
      component.load();

      // Assert
      expect(eventServiceMock.getByUserId).toHaveBeenCalledWith('u1');
    });

    it('should fetch by entity id, capitalizing the entity name, when the entity is not user', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'trip';
      component.entityId = 't1';

      // Act
      component.load();

      // Assert
      expect(eventServiceMock.getByEntityId).toHaveBeenCalledWith('t1', 'Trip');
    });

    it('should fetch by the current user id when onlyMine is set', () => {
      // Arrange
      const component = createComponent();
      component.onlyMine = true;
      component.ngOnInit();
      accountServiceMock.user$.next({ id: 'u1' });
      eventServiceMock.getByUserId.mockClear();

      // Act
      component.load();

      // Assert
      expect(eventServiceMock.getByUserId).toHaveBeenCalledWith('u1');
    });

    it('should do nothing for onlyMine when there is no current user yet', () => {
      // Arrange
      const component = createComponent();
      component.onlyMine = true;

      // Act
      component.load();

      // Assert
      expect(eventServiceMock.getByUserId).not.toHaveBeenCalled();
    });

    it('should fall back to getAll when nothing else applies', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.load();

      // Assert
      expect(eventServiceMock.getAll).toHaveBeenCalled();
    });
  });

  describe('column definitions', () => {
    it('should fall back to an empty string when the title cellRenderer receives no value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'title')!;

      // Act
      const html = (column.cellRenderer as (p: any) => string)({ value: null });

      // Assert
      expect(html).toBe('<a data-action="edit" class="ag-link"></a>');
    });

    it('should use the row color and label, with a default color, when the eventTypeName cellRenderer runs', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'eventTypeName')!;

      // Act
      const withColor = (column.cellRenderer as (p: any) => string)({
        value: 'Reunião',
        data: { eventTypeColor: '#ff0000' },
      });
      const withoutColor = (column.cellRenderer as (p: any) => string)({
        value: null,
        data: {},
      });

      // Assert
      expect(withColor).toContain('#ff0000');
      expect(withColor).toContain('Reunião');
      expect(withoutColor).toContain('#6c757d');
    });

    it('should format the date in BR when the startDate/endDate valueFormatters run with no value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const start = component.columnDefs.find((c) => c.field === 'startDate')!;
      const end = component.columnDefs.find((c) => c.field === 'endDate')!;

      // Act
      // Assert
      expect((start.valueFormatter as (p: any) => string)({ value: null })).toBe('');
      expect((end.valueFormatter as (p: any) => string)({ value: null })).toBe('');
    });

    it('should show only a view button when the actions cellRenderer runs for a read-only row', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.headerName === 'COMMON.ACTIONS')!;

      // Act
      const html = (column.cellRenderer as (p: any) => string)({ data: { readOnly: true } });

      // Assert
      expect(html).toContain('fa-eye');
      expect(html).not.toContain('fa-trash');
    });

    it('should show edit/delete buttons when the actions cellRenderer runs for a normal row', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.headerName === 'COMMON.ACTIONS')!;

      // Act
      const html = (column.cellRenderer as (p: any) => string)({ data: { readOnly: false } });

      // Assert
      expect(html).toContain('fa-edit');
      expect(html).toContain('fa-trash');
    });
  });
});
