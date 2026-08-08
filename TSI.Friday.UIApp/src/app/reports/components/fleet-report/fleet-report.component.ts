import { Component, OnInit } from '@angular/core';
import {
  Commission,
  CommissionStatus,
  Driver,
  DriverService,
  DriverStatus,
  Order,
  OrderService,
  ServiceOrderService,
  Vehicle,
  VehicleMaintenance,
  VehicleMaintenanceService,
  VehicleService,
  VehicleStatus,
} from '@friday/core';
import { forkJoin, map, switchMap } from 'rxjs';

interface VehicleSummaryRow {
  plate: string;
  brandModel: string;
  status: VehicleStatus;
  tripCount: number;
  revenue: number;
  maintenanceCost: number;
}

interface DriverSummaryRow {
  name: string;
  status: DriverStatus;
  tripCount: number;
  commissionPending: number;
  commissionPaid: number;
}

@Component({
  selector: 'app-fleet-report',
  templateUrl: './fleet-report.component.html',
  styleUrl: './fleet-report.component.scss',
  standalone: false,
})
export class FleetReportComponent implements OnInit {
  loading = false;

  totalVehicles = 0;
  availableVehicles = 0;
  blockedVehicles = 0;
  totalDrivers = 0;
  activeDrivers = 0;
  totalTrips = 0;
  totalRevenue = 0;
  totalMaintenanceCost = 0;
  totalCommissionPending = 0;
  totalCommissionPaid = 0;

  vehicleRows: VehicleSummaryRow[] = [];
  driverRows: DriverSummaryRow[] = [];

  constructor(
    private driverService: DriverService,
    private orderService: OrderService,
    private serviceOrderService: ServiceOrderService,
    private vehicleMaintenanceService: VehicleMaintenanceService,
    private vehicleService: VehicleService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;

    forkJoin({
      vehicles: this.vehicleService.getAll(),
      orders: this.orderService.getAll(),
      maintenances: this.vehicleMaintenanceService.getAll(),
      drivers: this.driverService.getAll(),
    })
      .pipe(
        map(({ vehicles, orders, maintenances, drivers }) => ({
          vehicles: vehicles.data ?? [],
          orders: orders.data ?? [],
          maintenances: maintenances.data ?? [],
          drivers: drivers.data ?? [],
        })),
        switchMap(({ vehicles, orders, maintenances, drivers }) =>
          forkJoin(
            drivers.length
              ? drivers.map((driver) =>
                  this.serviceOrderService.getByDriver(driver.id).pipe(
                    map((response) => ({
                      driver,
                      commissions: (response.data ?? [])
                        .map((so) => so.commission)
                        .filter((c): c is Commission => !!c),
                    })),
                  ),
                )
              : [],
          ).pipe(
            map((driverCommissions) => ({
              vehicles,
              orders,
              maintenances,
              drivers,
              driverCommissions,
            })),
          ),
        ),
      )
      .subscribe(({ vehicles, orders, maintenances, drivers, driverCommissions }) => {
        this.buildSummary(vehicles, orders, maintenances, drivers, driverCommissions);
        this.loading = false;
      });
  }

  private buildSummary(
    vehicles: Vehicle[],
    orders: Order[],
    maintenances: VehicleMaintenance[],
    drivers: Driver[],
    driverCommissions: { driver: Driver; commissions: Commission[] }[],
  ): void {
    this.totalVehicles = vehicles.length;
    this.availableVehicles = vehicles.filter(
      (v) => v.status === VehicleStatus.Available,
    ).length;
    this.blockedVehicles = vehicles.filter((v) => v.status === VehicleStatus.Blocked).length;

    const trips = orders.filter((o) => !!o.vehicleId);
    this.totalTrips = trips.length;
    this.totalRevenue = trips.reduce((sum, o) => sum + (o.totalPrice ?? 0), 0);
    this.totalMaintenanceCost = maintenances.reduce((sum, m) => sum + (m.cost ?? 0), 0);

    const vehicleMap = new Map<string, VehicleSummaryRow>();
    for (const vehicle of vehicles) {
      vehicleMap.set(vehicle.id, {
        plate: vehicle.plate,
        brandModel: `${vehicle.brand ?? ''} ${vehicle.model ?? ''}`.trim(),
        status: vehicle.status,
        tripCount: 0,
        revenue: 0,
        maintenanceCost: 0,
      });
    }
    for (const order of trips) {
      const row = order.vehicleId ? vehicleMap.get(order.vehicleId) : undefined;
      if (row) {
        row.tripCount += 1;
        row.revenue += order.totalPrice ?? 0;
      }
    }
    for (const maintenance of maintenances) {
      const row = vehicleMap.get(maintenance.vehicleId);
      if (row) {
        row.maintenanceCost += maintenance.cost ?? 0;
      }
    }
    this.vehicleRows = Array.from(vehicleMap.values()).sort(
      (a, b) => b.revenue - a.revenue,
    );

    this.totalDrivers = drivers.length;
    this.activeDrivers = drivers.filter((d) => d.status === DriverStatus.Active).length;

    this.driverRows = driverCommissions.map(({ driver, commissions }) => {
      const pending = commissions
        .filter((c) => c.status === CommissionStatus.Pending)
        .reduce((sum, c) => sum + c.amount, 0);
      const paid = commissions
        .filter((c) => c.status === CommissionStatus.Paid)
        .reduce((sum, c) => sum + c.amount, 0);

      return {
        name: driver.name,
        status: driver.status,
        tripCount: commissions.length,
        commissionPending: pending,
        commissionPaid: paid,
      };
    });

    this.totalCommissionPending = this.driverRows.reduce(
      (sum, r) => sum + r.commissionPending,
      0,
    );
    this.totalCommissionPaid = this.driverRows.reduce((sum, r) => sum + r.commissionPaid, 0);
  }
}
