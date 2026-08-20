import { Component, OnInit } from '@angular/core';
import {
  Commission,
  CommissionStatus,
  Driver,
  DriverService,
  DriverStatus,
  Trip,
  TripService,
  ServiceOrderService,
  Vehicle,
  VehicleMaintenance,
  VehicleMaintenanceService,
  VehicleService,
  VehicleStatus,
} from '@friday/core';
import { forkJoin, map, switchMap } from 'rxjs';
import { HeaderComponent } from '../../../shared/header/header.component';
import { CurrencyPipe } from '@angular/common';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

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
    imports: [
        HeaderComponent,
        CurrencyPipe,
        TranslatePipe,
    ],
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
    private tripService: TripService,
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
      trips: this.tripService.getAll(),
      maintenances: this.vehicleMaintenanceService.getAll(),
      drivers: this.driverService.getAll(),
    })
      .pipe(
        map(({ vehicles, trips, maintenances, drivers }) => ({
          vehicles: vehicles.data ?? [],
          trips: trips.data ?? [],
          maintenances: maintenances.data ?? [],
          drivers: drivers.data ?? [],
        })),
        switchMap(({ vehicles, trips, maintenances, drivers }) =>
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
              trips,
              maintenances,
              drivers,
              driverCommissions,
            })),
          ),
        ),
      )
      .subscribe(({ vehicles, trips, maintenances, drivers, driverCommissions }) => {
        this.buildSummary(vehicles, trips, maintenances, drivers, driverCommissions);
        this.loading = false;
      });
  }

  private buildSummary(
    vehicles: Vehicle[],
    allTrips: Trip[],
    maintenances: VehicleMaintenance[],
    drivers: Driver[],
    driverCommissions: { driver: Driver; commissions: Commission[] }[],
  ): void {
    this.totalVehicles = vehicles.length;
    this.availableVehicles = vehicles.filter(
      (v) => v.status === VehicleStatus.Available,
    ).length;
    this.blockedVehicles = vehicles.filter((v) => v.status === VehicleStatus.Blocked).length;

    const trips = allTrips.filter((t) => !!t.vehicleId);
    this.totalTrips = trips.length;
    this.totalRevenue = trips.reduce((sum, t) => sum + (t.totalPrice ?? 0), 0);
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
    for (const trip of trips) {
      const row = trip.vehicleId ? vehicleMap.get(trip.vehicleId) : undefined;
      if (row) {
        row.tripCount += 1;
        row.revenue += trip.totalPrice ?? 0;
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
