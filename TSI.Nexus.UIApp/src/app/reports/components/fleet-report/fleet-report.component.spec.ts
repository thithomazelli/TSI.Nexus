import { Subject, of } from 'rxjs';
import {
  Commission,
  CommissionStatus,
  Driver,
  DriverStatus,
  ServiceOrder,
  Trip,
  Vehicle,
  VehicleMaintenance,
  VehicleStatus,
  WebApiResponse,
} from '@nexus/core';
import { FleetReportComponent } from './fleet-report.component';

describe('FleetReportComponent', () => {
  let driverServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let tripServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let serviceOrderServiceMock: { getByDriver: ReturnType<typeof vi.fn> };
  let vehicleMaintenanceServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let vehicleServiceMock: { getAll: ReturnType<typeof vi.fn> };

  let vehicles$: Subject<WebApiResponse<Vehicle[]>>;
  let drivers$: Subject<WebApiResponse<Driver[]>>;

  function createComponent(): FleetReportComponent {
    vehicles$ = new Subject();
    drivers$ = new Subject();

    driverServiceMock = { getAll: vi.fn().mockReturnValue(drivers$) };
    tripServiceMock = { getAll: vi.fn().mockReturnValue(of({ data: [] } as unknown as WebApiResponse<Trip[]>)) };
    serviceOrderServiceMock = { getByDriver: vi.fn().mockReturnValue(of({ data: [] })) };
    vehicleMaintenanceServiceMock = {
      getAll: vi.fn().mockReturnValue(of({ data: [] } as unknown as WebApiResponse<VehicleMaintenance[]>)),
    };
    vehicleServiceMock = { getAll: vi.fn().mockReturnValue(vehicles$) };

    return new FleetReportComponent(
      driverServiceMock as never,
      tripServiceMock as never,
      serviceOrderServiceMock as never,
      vehicleMaintenanceServiceMock as never,
      vehicleServiceMock as never,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  it('should load the summary when vehicles$/drivers$ streams that never complete both emit', () => {
    // Arrange
    const component = createComponent();
    component.ngOnInit();

    expect(component.loading).toBe(true);

    const vehicle = { id: 'v1', plate: 'ABC1234', brand: 'Ford', model: 'Ka', status: VehicleStatus.Available } as Vehicle;
    const driver = { id: 'd1', name: 'João', status: DriverStatus.Active } as Driver;

    // Act
    vehicles$.next({ data: [vehicle] } as unknown as WebApiResponse<Vehicle[]>);
    drivers$.next({ data: [driver] } as unknown as WebApiResponse<Driver[]>);

    // Assert
    expect(component.loading).toBe(false);
    expect(component.totalVehicles).toBe(1);
    expect(component.totalDrivers).toBe(1);
    expect(component.vehicleRows).toEqual([
      { plate: 'ABC1234', brandModel: 'Ford Ka', status: VehicleStatus.Available, tripCount: 0, revenue: 0, maintenanceCost: 0 },
    ]);
    expect(serviceOrderServiceMock.getByDriver).toHaveBeenCalledWith('d1');
  });

  it('should not react to a second emission on vehicles$/drivers$ when take(1) already unsubscribed after the first combination', () => {
    // Arrange
    const component = createComponent();
    component.ngOnInit();

    // Act
    vehicles$.next({ data: [{ id: 'v1' } as Vehicle] } as unknown as WebApiResponse<Vehicle[]>);
    drivers$.next({ data: [] } as unknown as WebApiResponse<Driver[]>);
    expect(component.totalVehicles).toBe(1);

    vehicles$.next({
      data: [{ id: 'v1' } as Vehicle, { id: 'v2' } as Vehicle],
    } as unknown as WebApiResponse<Vehicle[]>);

    // Assert
    expect(component.totalVehicles).toBe(1);
  });

  it('should aggregate driver commissions by status when serviceOrderService.getByDriver returns pending and paid commissions', () => {
    // Arrange
    const component = createComponent();
    const driver = { id: 'd1', name: 'João', status: DriverStatus.Active } as Driver;
    const pendingCommission = { amount: 100, status: CommissionStatus.Pending } as Commission;
    const paidCommission = { amount: 50, status: CommissionStatus.Paid } as Commission;
    serviceOrderServiceMock.getByDriver.mockReturnValue(
      of({
        data: [
          { commission: pendingCommission, issueDate: new Date() } as unknown as ServiceOrder,
          { commission: paidCommission, issueDate: new Date() } as unknown as ServiceOrder,
          { commission: null, issueDate: new Date() } as unknown as ServiceOrder,
        ],
      }),
    );

    // Act
    component.ngOnInit();
    vehicles$.next({ data: [] } as unknown as WebApiResponse<Vehicle[]>);
    drivers$.next({ data: [driver] } as unknown as WebApiResponse<Driver[]>);

    // Assert
    expect(component.driverRows).toEqual([
      { name: 'João', status: DriverStatus.Active, tripCount: 2, commissionPending: 100, commissionPaid: 50 },
    ]);
    expect(component.totalCommissionPending).toBe(100);
    expect(component.totalCommissionPaid).toBe(50);
  });

  it('should treat a getByDriver response with no data as no commissions', () => {
    // Arrange
    const component = createComponent();
    const driver = { id: 'd1', name: 'João', status: DriverStatus.Active } as Driver;
    serviceOrderServiceMock.getByDriver.mockReturnValue(of({}));

    // Act
    component.ngOnInit();
    vehicles$.next({ data: [] } as unknown as WebApiResponse<Vehicle[]>);
    drivers$.next({ data: [driver] } as unknown as WebApiResponse<Driver[]>);

    // Assert
    expect(component.driverRows).toEqual([
      { name: 'João', status: DriverStatus.Active, tripCount: 0, commissionPending: 0, commissionPaid: 0 },
    ]);
  });

  it('should skip serviceOrderService.getByDriver entirely when there are no drivers', () => {
    // Arrange
    const component = createComponent();
    component.ngOnInit();

    // Act
    vehicles$.next({ data: [] } as unknown as WebApiResponse<Vehicle[]>);
    drivers$.next({ data: [] } as unknown as WebApiResponse<Driver[]>);

    // Assert
    expect(serviceOrderServiceMock.getByDriver).not.toHaveBeenCalled();
    expect(component.driverRows).toEqual([]);
  });

  describe('date range filtering', () => {
    it('should narrow trips/maintenances/commissions to the selected range when applyFilters is called', () => {
      // Arrange
      const component = createComponent();
      tripServiceMock.getAll.mockReturnValue(
        of({
          data: [
            { vehicleId: 'v1', date: new Date('2024-01-10'), totalPrice: 100 },
            { vehicleId: 'v1', date: new Date('2024-06-10'), totalPrice: 200 },
          ],
        } as unknown as WebApiResponse<Trip[]>),
      );

      component.ngOnInit();
      vehicles$.next({
        data: [{ id: 'v1', plate: 'ABC1234', brand: 'Ford', model: 'Ka', status: VehicleStatus.Available } as Vehicle],
      } as unknown as WebApiResponse<Vehicle[]>);
      drivers$.next({ data: [] } as unknown as WebApiResponse<Driver[]>);

      expect(component.totalRevenue).toBe(300);

      // Act
      component.filterStartDate = '2024-01-01';
      component.filterEndDate = '2024-01-31';
      component.applyFilters();

      // Assert
      expect(component.totalRevenue).toBe(100);

      component.clearFilters();

      expect(component.filterStartDate).toBeNull();
      expect(component.filterEndDate).toBeNull();
      expect(component.totalRevenue).toBe(300);
    });
  });

  it('should fall back to an empty array of drivers when the response has no data', () => {
    // Arrange
    const component = createComponent();
    component.ngOnInit();

    // Act
    vehicles$.next({ data: [] } as unknown as WebApiResponse<Vehicle[]>);
    drivers$.next({} as unknown as WebApiResponse<Driver[]>);

    // Assert
    expect(component.totalDrivers).toBe(0);
  });

  it('should sort vehicle rows by revenue descending', () => {
    // Arrange
    const component = createComponent();
    tripServiceMock.getAll.mockReturnValue(
      of({
        data: [
          { vehicleId: 'v1', totalPrice: 50 },
          { vehicleId: 'v2', totalPrice: 200 },
        ],
      } as unknown as WebApiResponse<Trip[]>),
    );

    // Act
    component.ngOnInit();
    vehicles$.next({
      data: [
        { id: 'v1', plate: 'AAA1111', status: VehicleStatus.Available } as Vehicle,
        { id: 'v2', plate: 'BBB2222', status: VehicleStatus.Available } as Vehicle,
      ],
    } as unknown as WebApiResponse<Vehicle[]>);
    drivers$.next({ data: [] } as unknown as WebApiResponse<Driver[]>);

    // Assert
    expect(component.vehicleRows.map((r) => r.plate)).toEqual(['BBB2222', 'AAA1111']);
  });

  it('should not index a trip with no vehicleId in the per-vehicle map when buildSummary is called directly', () => {
    // applyFilters already excludes vehicleId-less trips before buildSummary ever sees them, so
    // this ternary's false branch is otherwise unreachable - exercised directly.
    // Arrange
    const component = createComponent();
    const vehicle = { id: 'v1', plate: 'ABC1234', status: VehicleStatus.Available } as Vehicle;

    // Act
    // Assert
    expect(() =>
      (component as any).buildSummary(
        [vehicle],
        [{ vehicleId: undefined, totalPrice: 500 } as unknown as Trip],
        [],
        [],
        [],
      ),
    ).not.toThrow();

    expect(component.vehicleRows[0].tripCount).toBe(0);
  });

  it('should fall back to an empty array for every ?? [] when the responses have no data', () => {
    // Arrange
    const component = createComponent();
    tripServiceMock.getAll.mockReturnValue(of({} as unknown as WebApiResponse<Trip[]>));
    vehicleMaintenanceServiceMock.getAll.mockReturnValue(of({} as unknown as WebApiResponse<VehicleMaintenance[]>));
    const driver = { id: 'd1', name: 'João', status: DriverStatus.Active } as Driver;
    serviceOrderServiceMock.getByDriver.mockReturnValue(of({}));

    // Act
    component.ngOnInit();
    vehicles$.next({} as unknown as WebApiResponse<Vehicle[]>);
    drivers$.next({ data: [driver] } as unknown as WebApiResponse<Driver[]>);

    // Assert
    expect(component.totalVehicles).toBe(0);
    expect(component.totalTrips).toBe(0);
    expect(component.totalMaintenanceCost).toBe(0);
    expect(component.driverRows).toEqual([
      { name: 'João', status: DriverStatus.Active, tripCount: 0, commissionPending: 0, commissionPaid: 0 },
    ]);
  });

  describe('buildSummary vehicle/trip/maintenance matching', () => {
    function loadWith(
      component: FleetReportComponent,
      vehicles: Partial<Vehicle>[],
      trips: Partial<Trip>[],
      maintenances: Partial<VehicleMaintenance>[],
    ) {
      tripServiceMock.getAll.mockReturnValue(of({ data: trips } as unknown as WebApiResponse<Trip[]>));
      vehicleMaintenanceServiceMock.getAll.mockReturnValue(
        of({ data: maintenances } as unknown as WebApiResponse<VehicleMaintenance[]>),
      );
      component.ngOnInit();
      vehicles$.next({ data: vehicles } as unknown as WebApiResponse<Vehicle[]>);
      drivers$.next({ data: [] } as unknown as WebApiResponse<Driver[]>);
    }

    it('should skip trips with no vehicleId when tallying per-vehicle totals', () => {
      // Arrange
      const component = createComponent();

      // Act
      loadWith(
        component,
        [{ id: 'v1', plate: 'ABC1234', status: VehicleStatus.Available }],
        [{ vehicleId: undefined, totalPrice: 500 } as unknown as Trip],
        [],
      );

      // Assert
      expect(component.vehicleRows[0].tripCount).toBe(0);
      expect(component.vehicleRows[0].revenue).toBe(0);
      // the trip itself is excluded from applyFilters (requires a vehicleId), so it never even
      // reaches buildSummary - the fleet-wide totalRevenue stays at 0 too.
      expect(component.totalRevenue).toBe(0);
    });

    it('should ignore a trip whose vehicleId matches no known vehicle', () => {
      // Arrange
      const component = createComponent();

      // Act
      loadWith(
        component,
        [{ id: 'v1', plate: 'ABC1234', status: VehicleStatus.Available }],
        [{ vehicleId: 'unknown-vehicle', totalPrice: 500 } as unknown as Trip],
        [],
      );

      // Assert
      expect(component.vehicleRows[0].tripCount).toBe(0);
      expect(component.totalRevenue).toBe(500);
    });

    it('should treat a trip with no totalPrice as zero revenue fleet-wide and per-vehicle', () => {
      // Arrange
      const component = createComponent();

      // Act
      loadWith(
        component,
        [{ id: 'v1', plate: 'ABC1234', status: VehicleStatus.Available }],
        [{ vehicleId: 'v1', totalPrice: undefined } as unknown as Trip],
        [],
      );

      // Assert
      expect(component.totalRevenue).toBe(0);
      expect(component.vehicleRows[0].revenue).toBe(0);
      expect(component.vehicleRows[0].tripCount).toBe(1);
    });

    it('should ignore a maintenance whose vehicleId matches no known vehicle', () => {
      // Arrange
      const component = createComponent();

      // Act
      loadWith(
        component,
        [{ id: 'v1', plate: 'ABC1234', status: VehicleStatus.Available }],
        [],
        [{ vehicleId: 'unknown-vehicle', cost: 100 } as unknown as VehicleMaintenance],
      );

      // Assert
      expect(component.vehicleRows[0].maintenanceCost).toBe(0);
      expect(component.totalMaintenanceCost).toBe(100);
    });

    it('should accumulate maintenance cost for a matching vehicle and treat a missing cost as zero', () => {
      // Arrange
      const component = createComponent();

      // Act
      loadWith(
        component,
        [{ id: 'v1', plate: 'ABC1234', status: VehicleStatus.Available }],
        [],
        [
          { vehicleId: 'v1', cost: 100 } as unknown as VehicleMaintenance,
          { vehicleId: 'v1', cost: undefined } as unknown as VehicleMaintenance,
        ],
      );

      // Assert
      expect(component.vehicleRows[0].maintenanceCost).toBe(100);
      expect(component.totalMaintenanceCost).toBe(100);
    });
  });

  describe('isInDateRange edge cases (via applyFilters)', () => {
    function loadWithTripDates(component: FleetReportComponent, dates: (Date | null)[]) {
      tripServiceMock.getAll.mockReturnValue(
        of({
          data: dates.map((date) => ({ vehicleId: 'v1', date, totalPrice: 10 })),
        } as unknown as WebApiResponse<Trip[]>),
      );
      component.ngOnInit();
      vehicles$.next({
        data: [{ id: 'v1', plate: 'ABC1234', status: VehicleStatus.Available } as Vehicle],
      } as unknown as WebApiResponse<Vehicle[]>);
      drivers$.next({ data: [] } as unknown as WebApiResponse<Driver[]>);
    }

    it('should exclude a record with no date once any date filter is active', () => {
      // Arrange
      const component = createComponent();
      loadWithTripDates(component, [null]);
      component.filterStartDate = '2024-01-01';

      // Act
      component.applyFilters();

      // Assert
      expect(component.totalTrips).toBe(0);
    });

    it('should filter by start date alone when no end date is set', () => {
      // Arrange
      const component = createComponent();
      loadWithTripDates(component, [new Date('2024-01-01'), new Date('2024-06-01')]);
      component.filterStartDate = '2024-03-01';

      // Act
      component.applyFilters();

      // Assert
      expect(component.totalTrips).toBe(1);
      expect(component.totalRevenue).toBe(10);
    });

    it('should filter by end date alone when no start date is set', () => {
      // Arrange
      const component = createComponent();
      loadWithTripDates(component, [new Date('2024-01-01'), new Date('2024-06-01')]);
      component.filterEndDate = '2024-03-01';

      // Act
      component.applyFilters();

      // Assert
      expect(component.totalTrips).toBe(1);
      expect(component.totalRevenue).toBe(10);
    });

    it('should include maintenance records within the selected date range', () => {
      // Arrange
      const component = createComponent();
      vehicleMaintenanceServiceMock.getAll.mockReturnValue(
        of({
          data: [
            { vehicleId: 'v1', scheduledDate: new Date('2024-01-15'), cost: 100 },
            { vehicleId: 'v1', scheduledDate: new Date('2024-06-15'), cost: 200 },
          ],
        } as unknown as WebApiResponse<VehicleMaintenance[]>),
      );
      component.ngOnInit();
      vehicles$.next({
        data: [{ id: 'v1', plate: 'ABC1234', status: VehicleStatus.Available } as Vehicle],
      } as unknown as WebApiResponse<Vehicle[]>);
      drivers$.next({ data: [] } as unknown as WebApiResponse<Driver[]>);
      expect(component.totalMaintenanceCost).toBe(300);

      // Act
      component.filterStartDate = '2024-01-01';
      component.filterEndDate = '2024-01-31';
      component.applyFilters();

      // Assert
      expect(component.totalMaintenanceCost).toBe(100);
    });
  });

  it('should flip showFilters when toggleFilters is called', () => {
    // Arrange
    const component = createComponent();

    expect(component.showFilters).toBe(false);

    // Act
    component.toggleFilters();

    // Assert
    expect(component.showFilters).toBe(true);

    component.toggleFilters();

    expect(component.showFilters).toBe(false);
  });
});
