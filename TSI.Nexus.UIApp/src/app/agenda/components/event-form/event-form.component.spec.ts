import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AgendaEvent,
  BusinessPartnerService,
  DriverService,
  EventParticipant,
  EventParticipantService,
  EventService,
  FuelLogService,
  ModalService,
  NotificationService,
  OrderService,
  PaymentService,
  PurchaseOrderService,
  QuoteService,
  ResponseStatus,
  SelectableOptionService,
  TransactionService,
  TranslationService,
  TripService,
  User,
  UserService,
  VehicleMaintenanceService,
  VehicleService,
  WebApiResponse,
} from '@nexus/core';
import { config, of, throwError } from 'rxjs';
import { EventFormComponent } from './event-form.component';

describe('EventFormComponent', () => {
  let modalServiceMock: { hideModal: ReturnType<typeof vi.fn> };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let eventServiceMock: { add: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  let eventParticipantServiceMock: { add: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
  let selectableOptionServiceMock: { getByGroup: ReturnType<typeof vi.fn> };
  let businessPartnerServiceMock: { getClients: ReturnType<typeof vi.fn>; getSuppliers: ReturnType<typeof vi.fn> };
  let listServiceMocks: Record<string, { getAll: ReturnType<typeof vi.fn> }>;
  let userServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  const users: User[] = [
    { id: 'u1', firstName: 'Ana', lastName: 'Silva' } as User,
    { id: 'u2', firstName: 'Bruno', lastName: 'Costa' } as User,
  ];

  function createComponent(): EventFormComponent {
    modalServiceMock = { hideModal: vi.fn() };
    notificationServiceMock = { showMessage: vi.fn() };
    eventServiceMock = { add: vi.fn(), update: vi.fn(), delete: vi.fn() };
    eventParticipantServiceMock = { add: vi.fn().mockReturnValue(of(null)), delete: vi.fn().mockReturnValue(of(null)) };
    selectableOptionServiceMock = { getByGroup: vi.fn().mockReturnValue(of({ data: [] })) };
    businessPartnerServiceMock = {
      getClients: vi.fn().mockReturnValue(of({ data: [] })),
      getSuppliers: vi.fn().mockReturnValue(of({ data: [] })),
    };
    listServiceMocks = {
      quote: { getAll: vi.fn().mockReturnValue(of({ data: [] })) },
      order: { getAll: vi.fn().mockReturnValue(of({ data: [] })) },
      purchaseOrder: { getAll: vi.fn().mockReturnValue(of({ data: [] })) },
      trip: { getAll: vi.fn().mockReturnValue(of({ data: [] })) },
      transaction: { getAll: vi.fn().mockReturnValue(of({ data: [] })) },
      payment: { getAll: vi.fn().mockReturnValue(of({ data: [] })) },
      vehicle: { getAll: vi.fn().mockReturnValue(of({ data: [] })) },
      driver: { getAll: vi.fn().mockReturnValue(of({ data: [] })) },
      vehicleMaintenance: { getAll: vi.fn().mockReturnValue(of({ data: [] })) },
      fuelLog: { getAll: vi.fn().mockReturnValue(of({ data: [] })) },
    };
    userServiceMock = { getAll: vi.fn().mockReturnValue(of({ data: users })) };
    routerMock = { navigateByUrl: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new EventFormComponent(
      new FormBuilder(),
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      eventServiceMock as unknown as EventService,
      eventParticipantServiceMock as unknown as EventParticipantService,
      selectableOptionServiceMock as unknown as SelectableOptionService,
      businessPartnerServiceMock as unknown as BusinessPartnerService,
      listServiceMocks['quote'] as unknown as QuoteService,
      listServiceMocks['order'] as unknown as OrderService,
      listServiceMocks['purchaseOrder'] as unknown as PurchaseOrderService,
      listServiceMocks['trip'] as unknown as TripService,
      listServiceMocks['transaction'] as unknown as TransactionService,
      listServiceMocks['payment'] as unknown as PaymentService,
      listServiceMocks['vehicle'] as unknown as VehicleService,
      listServiceMocks['driver'] as unknown as DriverService,
      listServiceMocks['vehicleMaintenance'] as unknown as VehicleMaintenanceService,
      listServiceMocks['fuelLog'] as unknown as FuelLogService,
      userServiceMock as unknown as UserService,
      routerMock as unknown as Router,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  function fillValidForm(component: EventFormComponent) {
    component.form.patchValue({
      title: 'Reunião',
      startDate: '2099-01-01',
      startTime: '09:00',
      endDate: '2099-01-01',
      endTime: '10:00',
      eventTypeOptionId: 'et1',
    });
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should build the form, link configs, and load event types and users when ngOnInit runs', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.linkConfigs.length).toBe(11);
      expect(selectableOptionServiceMock.getByGroup).toHaveBeenCalled();
      expect(userServiceMock.getAll).toHaveBeenCalled();
    });

    it('should fall back to empty arrays for event types and users when their responses have no data', () => {
      // Arrange
      const component = createComponent();
      selectableOptionServiceMock.getByGroup.mockReturnValue(of({}));
      userServiceMock.getAll.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.eventTypeOptions).toEqual([]);
      expect(component.users).toEqual([]);
    });

    it('should patch the form and link values when data is provided', () => {
      // Arrange
      const component = createComponent();
      component.data = {
        title: 'Evento existente',
        startDate: '2024-01-01T09:30:00',
        endDate: '2024-01-01T10:30:00',
        driverId: 'd1',
        participants: [{ id: 'p1', displayName: 'Ana' } as EventParticipant],
      } as unknown as AgendaEvent;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('title')!.value).toBe('Evento existente');
      expect(component.form.get('startTime')!.value).toBe('09:30');
      expect(component.participants).toEqual([{ id: 'p1', displayName: 'Ana' }]);
    });

    it('should leave link values untouched when the data does not carry matching ids', () => {
      // Arrange
      const component = createComponent();
      component.data = { title: 'x' } as AgendaEvent;

      // Act
      // Assert
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should prefill start, end, and the locked link when creating a fresh event', () => {
      // Arrange
      const component = createComponent();
      component.prefillStart = new Date(2024, 0, 1, 14, 0);
      component.prefillEnd = new Date(2024, 0, 1, 15, 0);
      component.lockedLinkField = 'tripId';
      component.lockedLinkId = 't1';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('startDate')!.value).toEqual(component.prefillStart);
      expect(component.form.get('startTime')!.value).toBe('14:00');
      expect(component.form.get('endTime')!.value).toBe('15:00');
    });

    it('should not prefill anything when there is no data and no prefill or lock inputs', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnInit()).not.toThrow();
      expect(component.form.get('startDate')!.value).toBe('');
    });
  });

  describe('ngOnChanges', () => {
    it('should re-patch the form when data changes after init', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.data = { title: 'Novo título' } as AgendaEvent;

      // Act
      component.ngOnChanges({ data: {} as any });

      // Assert
      expect(component.form.get('title')!.value).toBe('Novo título');
    });

    it('should do nothing when the changed input is not data', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.ngOnChanges({ isEdit: {} as any });

      // Assert
      expect(component.form.get('title')!.value).toBe('');
    });

    it('should not throw when data changes before the form exists', () => {
      // Arrange
      const component = createComponent();
      component.data = { title: 'x' } as AgendaEvent;

      // Act
      // Assert
      expect(() => component.ngOnChanges({ data: {} as any })).not.toThrow();
    });
  });

  describe('link fields', () => {
    it('should store the id and set the label without emitting a change event when selectLink is called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const config = component.linkConfigs[0];

      // Act
      component.selectLink(config, { id: 'bp1', label: 'Cliente X' });

      // Assert
      expect(component.form.get(config.labelField)!.value).toBe('Cliente X');
    });

    it('should clear the link value when the typed label is blank on blur', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      const config = component.linkConfigs[0];
      component.selectLink(config, { id: 'bp1', label: 'Cliente X' });
      component.form.get(config.labelField)!.setValue('   ');

      // Act
      component.onLinkBlur(config);
      vi.advanceTimersByTime(200);

      // Assert
      expect((component as any).buildLinkPayload()[config.idField]).toBeNull();
    });

    it('should keep the link value when the typed label is not blank on blur', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      const config = component.linkConfigs[0];
      component.selectLink(config, { id: 'bp1', label: 'Cliente X' });

      // Act
      component.onLinkBlur(config);
      vi.advanceTimersByTime(200);

      // Assert
      expect((component as any).buildLinkPayload()[config.idField]).toBe('bp1');
    });

    it('should clear the link value when the label control value is null on blur', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      const config = component.linkConfigs[0];
      component.selectLink(config, { id: 'bp1', label: 'Cliente X' });
      component.form.get(config.labelField)!.setValue(null);

      // Act
      component.onLinkBlur(config);
      vi.advanceTimersByTime(200);

      // Assert
      expect((component as any).buildLinkPayload()[config.idField]).toBeNull();
    });

    it('should reset both the stored id and the label control when clearLink is called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const config = component.linkConfigs[0];
      component.selectLink(config, { id: 'bp1', label: 'Cliente X' });

      // Act
      component.clearLink(config);

      // Assert
      expect(component.form.get(config.labelField)!.value).toBe('');
      expect((component as any).buildLinkPayload()[config.idField]).toBeNull();
    });

    it('should flip linkSectionOpen when toggleLinkSection is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.linkSectionOpen).toBe(true);
      component.toggleLinkSection();
      expect(component.linkSectionOpen).toBe(false);
    });

    it('should filter link options when a label is typed', () => {
      // Arrange
      const component = createComponent();
      businessPartnerServiceMock.getClients.mockReturnValue(
        of({ data: [{ id: 'bp1', name: 'Cliente Um' }] }),
      );
      component.ngOnInit();
      const linkConfig = component.linkConfigs[0];

      // Act
      let result: unknown[] = [];
      linkConfig.filtered$!.subscribe((r) => (result = r));
      linkConfig.activate();
      component.form.get(linkConfig.labelField)!.setValue('cliente');

      // Assert
      expect(result).toEqual([{ id: 'bp1', label: 'Cliente Um' }]);
    });

    it('should emit an empty list when the link filter value is blank', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const config = component.linkConfigs[0];
      config.activate();

      // Act
      let result: unknown[] = [];
      config.filtered$!.subscribe((r) => (result = r));

      // Assert
      expect(result).toEqual([]);
    });

    it('should fetch only once when activate is called multiple times', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const config = component.linkConfigs[0];

      // Act
      config.items$.subscribe();
      config.items$.subscribe();
      config.activate();
      config.activate();

      // Assert
      expect(businessPartnerServiceMock.getClients).toHaveBeenCalledTimes(1);
    });

    it('should treat a non-string label value as empty in filtered$', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const config = component.linkConfigs[0];

      // Act
      let result: unknown[] = [];
      config.filtered$!.subscribe((r) => (result = r));
      config.activate();
      component.form.get(config.labelField)!.setValue(123 as unknown as string);

      // Assert
      expect(result).toEqual([]);
    });

    it('should fall back to an empty array when clients and suppliers responses have no data', () => {
      // Arrange
      const component = createComponent();
      businessPartnerServiceMock.getClients.mockReturnValue(of({}));
      businessPartnerServiceMock.getSuppliers.mockReturnValue(of({}));
      component.ngOnInit();
      const config = component.linkConfigs[0];

      // Act
      let result: unknown[] = [];
      config.items$.subscribe((items) => (result = items));
      config.activate();

      // Assert
      expect(result).toEqual([]);
    });

    it('should activate every non-business-partner link and map its items via mapList', () => {
      // Arrange
      const component = createComponent();
      const sampleData: Record<string, unknown> = {
        quote: { data: [{ id: 'q1', quoteNumber: 'Q-1' }] },
        order: { data: [{ id: 'o1', orderNumber: 'O-1' }] },
        purchaseOrder: { data: [{ id: 'po1', purchaseOrderNumber: 'PO-1' }] },
        trip: { data: [{ id: 't1', tripNumber: 'T-1' }] },
        transaction: { data: [{ id: 'tr1', description: 'Trans 1' }] },
        payment: { data: [{ id: 'p1', description: 'Pay 1' }] },
        vehicle: { data: [{ id: 'v1', plate: 'ABC1234' }] },
        driver: { data: [{ id: 'd1', name: 'Driver 1' }] },
        vehicleMaintenance: { data: [{ id: 'vm1', description: 'Maint 1' }] },
        fuelLog: { data: [{ id: 'fl1', gasStation: 'Posto 1' }] },
      };
      Object.entries(sampleData).forEach(([key, response]) => {
        listServiceMocks[key].getAll.mockReturnValue(of(response));
      });
      component.ngOnInit();

      // Act
      const results: Record<string, unknown[]> = {};
      component.linkConfigs.slice(1).forEach((config) => {
        config.items$.subscribe((items) => (results[config.key] = items));
        config.activate();
      });

      // Assert
      expect(results['quote']).toEqual([{ id: 'q1', label: 'Q-1' }]);
      expect(results['order']).toEqual([{ id: 'o1', label: 'O-1' }]);
      expect(results['purchaseOrder']).toEqual([{ id: 'po1', label: 'PO-1' }]);
      expect(results['trip']).toEqual([{ id: 't1', label: 'T-1' }]);
      expect(results['transaction']).toEqual([{ id: 'tr1', label: 'Trans 1' }]);
      expect(results['payment']).toEqual([{ id: 'p1', label: 'Pay 1' }]);
      expect(results['vehicle']).toEqual([{ id: 'v1', label: 'ABC1234' }]);
      expect(results['driver']).toEqual([{ id: 'd1', label: 'Driver 1' }]);
      expect(results['vehicleMaintenance']).toEqual([{ id: 'vm1', label: 'Maint 1' }]);
      expect(results['fuelLog']).toEqual([{ id: 'fl1', label: 'Posto 1' }]);
    });

    it('should fall back to an empty array in mapList when the response has no data', () => {
      // Arrange
      const component = createComponent();
      listServiceMocks['quote'].getAll.mockReturnValue(of({}));
      component.ngOnInit();
      const config = component.linkConfigs[1];

      // Act
      let result: unknown[] = [];
      config.items$.subscribe((items) => (result = items));
      config.activate();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('participants', () => {
    it('should add a participant and clear the search field when selectUser is called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.get('participantSearch')!.setValue('ana');

      // Act
      component.selectUser(users[0]);

      // Assert
      expect(component.participants).toEqual([{ id: '', userId: 'u1', displayName: 'Ana Silva' }]);
      expect(component.form.get('participantSearch')!.value).toBe('');
    });

    it('should do nothing when the user is already a participant', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.participants = [{ id: '', userId: 'u1', displayName: 'Ana Silva' } as EventParticipant];

      // Act
      component.selectUser(users[0]);

      // Assert
      expect(component.participants.length).toBe(1);
    });

    it('should filter users by name when the participant search field changes', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      let result: User[] = [];
      component.filteredUsers$.subscribe((r) => (result = r));
      component.form.get('participantSearch')!.setValue('bruno');

      // Assert
      expect(result).toEqual([users[1]]);
    });

    it('should treat a non-string search value as empty in filteredUsers$', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      let result: User[] = [];
      component.filteredUsers$.subscribe((r) => (result = r));
      component.form.get('participantSearch')!.setValue(123 as unknown as string);

      // Assert
      expect(result).toEqual([]);
    });

    it('should emit an empty list when the participant search value is blank', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      let result: User[] = [];
      component.filteredUsers$.subscribe((r) => (result = r));

      // Assert
      expect(result).toEqual([]);
    });

    it('should add by name and email and clear the fields when addFreeformParticipant is called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.get('participantName')!.setValue('Carla');
      component.form.get('participantEmail')!.setValue('carla@x.com');

      // Act
      component.addFreeformParticipant();

      // Assert
      expect(component.participants).toEqual([
        { id: '', name: 'Carla', email: 'carla@x.com', displayName: 'Carla' },
      ]);
      expect(component.form.get('participantName')!.value).toBe('');
      expect(component.form.get('participantEmail')!.value).toBe('');
    });

    it('should fall back to name-only when no email is given in addFreeformParticipant', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.get('participantName')!.setValue('Carla');

      // Act
      component.addFreeformParticipant();

      // Assert
      expect(component.participants).toEqual([
        { id: '', name: 'Carla', email: null, displayName: 'Carla' },
      ]);
    });

    it('should fall back to email-only when no name is given in addFreeformParticipant', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.get('participantEmail')!.setValue('carla@x.com');

      // Act
      component.addFreeformParticipant();

      // Assert
      expect(component.participants).toEqual([
        { id: '', name: null, email: 'carla@x.com', displayName: 'carla@x.com' },
      ]);
    });

    it('should do nothing when both name and email are blank in addFreeformParticipant', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.addFreeformParticipant();

      // Assert
      expect(component.participants).toEqual([]);
    });

    it('should track the id of an already-persisted participant when removeParticipant is called', () => {
      // Arrange
      const component = createComponent();
      component.participants = [
        { id: 'p1', displayName: 'Ana' } as EventParticipant,
        { id: '', displayName: 'Carla' } as EventParticipant,
      ];

      // Act
      component.removeParticipant(0);

      // Assert
      expect(component.participants).toEqual([{ id: '', displayName: 'Carla' }]);
    });

    it('should not track an id when removeParticipant is called for a not-yet-persisted participant', () => {
      // Arrange
      const component = createComponent();
      component.participants = [{ id: '', displayName: 'Carla' } as EventParticipant];

      // Act
      // Assert
      expect(() => component.removeParticipant(0)).not.toThrow();
      expect(component.participants).toEqual([]);
    });
  });

  describe('submit', () => {
    it('should mark the form as touched and return null without saving when the form is invalid', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      let result: unknown;
      component.submit().subscribe((r) => (result = r));

      // Assert
      expect(result).toBeNull();
      expect(component.submitted).toBe(true);
    });

    it('should notify and return null without saving when there is no link at all', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);

      // Act
      let result: unknown;
      component.submit().subscribe((r) => (result = r));

      // Assert
      expect(result).toBeNull();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'AGENDA.LINK_REQUIRED',
      );
    });

    it('should save successfully and sync new participants when a locked link is present', () => {
      // Arrange
      const component = createComponent();
      component.lockedLinkField = 'tripId';
      component.lockedLinkId = 't1';
      component.ngOnInit();
      fillValidForm(component);
      component.participants = [{ id: '', userId: 'u1', displayName: 'Ana' } as EventParticipant];
      const response = { status: ResponseStatus.Success, data: { id: 'e1' }, message: 'OK' } as unknown as WebApiResponse<AgendaEvent>;
      eventServiceMock.add.mockReturnValue(of(response));

      // Act
      component.submit().subscribe();

      // Assert
      expect(eventServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ tripId: 't1' }),
      );
      expect(eventParticipantServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1', eventId: 'e1' }),
      );
    });

    it('should save successfully via link values when no field is locked', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      const config = component.linkConfigs[0];
      component.selectLink(config, { id: 'bp1', label: 'Cliente X' });
      eventServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'e1' }, message: 'OK' } as unknown as WebApiResponse<AgendaEvent>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(eventServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ [config.idField]: 'bp1' }),
      );
    });

    it('should update instead of add and include the id when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { id: 'e1' } as AgendaEvent;
      component.lockedLinkField = 'tripId';
      component.lockedLinkId = 't1';
      component.ngOnInit();
      fillValidForm(component);
      eventServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'e1' }, message: 'OK' } as unknown as WebApiResponse<AgendaEvent>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(eventServiceMock.update).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }));
    });

    it('should notify without syncing participants when the backend reports a failure status', () => {
      // Arrange
      const component = createComponent();
      component.lockedLinkField = 'tripId';
      component.lockedLinkId = 't1';
      component.ngOnInit();
      fillValidForm(component);
      eventServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Error, data: null, message: 'Falhou' } as unknown as WebApiResponse<AgendaEvent>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Error, 'Falhou');
      expect(eventParticipantServiceMock.add).not.toHaveBeenCalled();
    });

    it('should notify an error when the save request errors', () => {
      // Arrange
      const component = createComponent();
      component.lockedLinkField = 'tripId';
      component.lockedLinkId = 't1';
      component.ngOnInit();
      fillValidForm(component);
      eventServiceMock.add.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.submit().subscribe({ error: () => {} });

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'AGENDA.SAVE_ERROR',
      );
    });

    it('should save via the modal path when isModal is true', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = { close: vi.fn() };
      component.dialogRef = dialogRefMock as any;
      component.lockedLinkField = 'tripId';
      component.lockedLinkId = 't1';
      component.ngOnInit();
      fillValidForm(component);
      eventServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'e1' }, message: 'OK' } as unknown as WebApiResponse<AgendaEvent>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalled();
    });

    it('should save via the page path and navigate away when creating outside a modal', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.lockedLinkField = 'tripId';
      component.lockedLinkId = 't1';
      component.ngOnInit();
      fillValidForm(component);
      eventServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'e1' }, message: 'OK' } as unknown as WebApiResponse<AgendaEvent>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/agenda');
    });

    it('should update local data without navigating when editing outside a modal', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.isEdit = true;
      component.data = { id: 'e1' } as AgendaEvent;
      component.lockedLinkField = 'tripId';
      component.lockedLinkId = 't1';
      component.ngOnInit();
      fillValidForm(component);
      const updated = { id: 'e1', title: 'Reunião' } as AgendaEvent;
      eventServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, data: updated, message: 'OK' } as unknown as WebApiResponse<AgendaEvent>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(component.data).toBe(updated);
      expect(routerMock.navigateByUrl).not.toHaveBeenCalledWith('/agenda');
    });

    it('should remove participants marked for deletion during sync', () => {
      // Arrange
      const component = createComponent();
      component.lockedLinkField = 'tripId';
      component.lockedLinkId = 't1';
      component.ngOnInit();
      fillValidForm(component);
      component.participants = [
        { id: 'p1', displayName: 'Ana' } as EventParticipant,
        { id: 'p2', displayName: 'Bruno' } as EventParticipant,
      ];
      component.removeParticipant(0);
      eventServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, data: { id: 'e1' }, message: 'OK' } as unknown as WebApiResponse<AgendaEvent>),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(eventParticipantServiceMock.delete).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));
      expect(eventParticipantServiceMock.add).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should hide the modal when isModal is true', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = {};
      component.dialogRef = dialogRefMock as any;

      // Act
      component.cancel();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith(dialogRefMock);
    });

    it('should navigate back to the agenda when isModal is false', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;

      // Act
      component.cancel();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/agenda');
    });
  });

  describe('remove', () => {
    it('should do nothing when there is no data', () => {
      // Arrange
      const component = createComponent();
      component.data = null;

      // Act
      component.remove();

      // Assert
      expect(eventServiceMock.delete).not.toHaveBeenCalled();
    });

    it('should delete and navigate when the delete succeeds outside a modal', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'e1' } as AgendaEvent;
      eventServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' } as unknown as WebApiResponse<AgendaEvent>),
      );

      // Act
      component.remove();

      // Assert
      expect(modalServiceMock.hideModal).not.toHaveBeenCalled();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Success, 'Removido');
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/agenda');
    });

    it('should hide the modal and not navigate when the delete succeeds inside a modal', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      const dialogRefMock = {};
      component.dialogRef = dialogRefMock as any;
      component.data = { id: 'e1' } as AgendaEvent;
      eventServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' } as unknown as WebApiResponse<AgendaEvent>),
      );

      // Act
      component.remove();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith(dialogRefMock);
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should not navigate when the delete reports an error status', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.data = { id: 'e1' } as AgendaEvent;
      eventServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' } as unknown as WebApiResponse<AgendaEvent>),
      );

      // Act
      component.remove();

      // Assert
      expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should notify an error when the delete request errors', async () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'e1' } as AgendaEvent;
      eventServiceMock.delete.mockReturnValue(throwError(() => new Error('boom')));
      const originalOnUnhandledError = config.onUnhandledError;
      config.onUnhandledError = () => {};

      try {
        // Act
        component.remove();
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Assert
        expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
          ResponseStatus.Error,
          'AGENDA.SAVE_ERROR',
        );
      } finally {
        config.onUnhandledError = originalOnUnhandledError;
      }
    });
  });

  describe('date helpers (via submit)', () => {
    function submitWithDates(startDate: unknown, startTime = '09:00') {
      const component = createComponent();
      component.lockedLinkField = 'tripId';
      component.lockedLinkId = 't1';
      component.ngOnInit();
      component.form.patchValue({
        title: 'x',
        startDate,
        startTime,
        endDate: startDate,
        endTime: startTime,
        eventTypeOptionId: 'et1',
      });
      let payload: any;
      eventServiceMock.add.mockImplementation((event: AgendaEvent) => {
        payload = event;
        return of({ status: ResponseStatus.Success, data: { id: 'e1' }, message: 'OK' } as unknown as WebApiResponse<AgendaEvent>);
      });
      component.submit().subscribe();
      return payload;
    }

    it('should parse the date when given a Date instance', () => {
      // Act
      const payload = submitWithDates(new Date(2099, 0, 1));

      // Assert
      expect(payload.startDate.getFullYear()).toBe(2099);
    });

    it('should parse the date when given an object with its own toDate method', () => {
      // Arrange
      const fakeMoment = { toDate: () => new Date(2099, 0, 2) };

      // Act
      const payload = submitWithDates(fakeMoment);

      // Assert
      expect(payload.startDate.getDate()).toBe(2);
    });

    it('should parse the date when given a dd/mm/yyyy string', () => {
      // Act
      const payload = submitWithDates('15/03/2099');

      // Assert
      expect(payload.startDate.getFullYear()).toBe(2099);
      expect(payload.startDate.getMonth()).toBe(2);
      expect(payload.startDate.getDate()).toBe(15);
    });

    it('should parse the date when given an ISO-like string with no slashes', () => {
      // Act
      const payload = submitWithDates('2099-03-15');

      // Assert
      expect(payload.startDate.getFullYear()).toBe(2099);
    });

    it('should fall back to the current date and time when no date is given at all', () => {
      // startDate/endDate are required fields, so submit() can never reach toDate() with an
      // empty value through the public flow - exercised directly to cover the defensive branch.
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect((component as any).toDate('')).toBeInstanceOf(Date);
      expect((component as any).toDate(null)).toBeInstanceOf(Date);
      expect((component as any).toDate(undefined)).toBeInstanceOf(Date);
    });

    it('should fall back to day 1 and month 1 when the dd/mm/yyyy parts are zero', () => {
      // Arrange
      const component = createComponent();

      // Act
      const result = (component as any).toDate('0/0/2099');

      // Assert
      expect(result.getFullYear()).toBe(2099);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(1);
    });

    it('should fall back to midnight when combineDateTime is called with no time', () => {
      // Arrange
      const component = createComponent();

      // Act
      const result = (component as any).combineDateTime(new Date(2024, 0, 1), '');

      // Assert
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it('should do nothing when patchFormWithData is called before the form has been built', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => (component as any).patchFormWithData()).not.toThrow();
    });
  });
});
