import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Trip,
  WebApiResponse,
  OrderStatus,
  TripService,
  PaymentService,
  BusinessPartnerService,
  VehicleService,
  DriverService,
  TripLegService,
  PassengerService,
  ServiceOrderService,
  DocumentTemplateService,
  downloadLetterheadPdf,
} from '@friday/core';
import {
  Subject,
  Subscription,
  switchMap,
  takeUntil,
  merge,
  forkJoin,
  of,
} from 'rxjs';
import { catchError } from 'rxjs/operators';

import { buildContractPages, buildServiceOrderPages } from '../../utilities/trip-documents';

@Component({
  selector: 'app-trip-details-page',
  templateUrl: './trip-details-page.component.html',
  styleUrl: './trip-details-page.component.scss',
  standalone: false,
})
export class TripDetailsPageComponent implements OnInit, OnDestroy {
  isEdit = false;
  data?: Trip | null = null;
  id: string | null = null;
  loading = false;

  activeTab:
    | 'details'
    | 'drivers'
    | 'triplegs'
    | 'passengers'
    | 'payments'
    | 'attachments'
    | 'audit' = 'details';

  tripStatusOptions: Record<OrderStatus, string> = {
    [OrderStatus.Open]: 'Em aberto',
    [OrderStatus.Closed]: 'Finalizado',
    [OrderStatus.WaitingPayment]: 'Aguardando pagamento',
  };

  emittingContract = false;
  emittingServiceOrder = false;

  private _tripChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private tripService: TripService,
    private paymentService: PaymentService,
    private routerService: Router,
    private businessPartnerService: BusinessPartnerService,
    private vehicleService: VehicleService,
    private driverService: DriverService,
    private tripLegService: TripLegService,
    private passengerService: PassengerService,
    private serviceOrderService: ServiceOrderService,
    private documentTemplateService: DocumentTemplateService,
  ) {}

  ngOnInit(): void {
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = idParam;
      this.getTripById(idParam);
    } else {
      this.isEdit = false;
      // app-trip-form's own default for its `data` @Input is `{}`, which it relies on to build up
      // the new Trip via submit()'s Object.assign(this.data!, rawValue) - passing null here (as
      // opposed to just omitting the binding) overrides that default and leaves it null all the
      // way to save(), which then POSTs a null body (see TripDto Add() 415 - same class of bug
      // fixed earlier for business-partner-details-page's Add-mode `type` field).
      this.data = {} as Trip;
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._tripChangedSub) {
      this._tripChangedSub.unsubscribe();
    }
  }

  getStatusLabel(): string {
    if (!this.data || this.data.status == null) {
      return '';
    }

    return this.tripStatusOptions[this.data?.status] || '';
  }

  emitContract(): void {
    if (!this.data || this.emittingContract) {
      return;
    }
    const trip = this.data;
    this.emittingContract = true;

    forkJoin({
      businessPartner: trip.businessPartnerId
        ? this.businessPartnerService
            .getById(trip.businessPartnerId)
            .pipe(catchError(() => of({ data: null } as WebApiResponse<any>)))
        : of({ data: null } as WebApiResponse<any>),
      vehicle: trip.vehicleId
        ? this.vehicleService
            .getById(trip.vehicleId)
            .pipe(catchError(() => of({ data: null } as WebApiResponse<any>)))
        : of({ data: null } as WebApiResponse<any>),
      tripLegs: this.tripLegService
        .getByTrip(trip.id!)
        .pipe(catchError(() => of({ data: [] } as WebApiResponse<any>))),
    }).subscribe({
      next: ({ businessPartner, vehicle, tripLegs }) => {
        this.emittingContract = false;
        buildContractPages(
          this.documentTemplateService,
          trip,
          businessPartner.data ?? null,
          vehicle.data ?? null,
          tripLegs.data ?? [],
        ).subscribe((pages) => {
          downloadLetterheadPdf(pages, `contrato-${trip.tripNumber}.pdf`);
        });
      },
      error: () => {
        this.emittingContract = false;
      },
    });
  }

  emitServiceOrder(): void {
    if (!this.data || this.emittingServiceOrder) {
      return;
    }
    const trip = this.data;
    this.emittingServiceOrder = true;

    forkJoin({
      vehicle: trip.vehicleId
        ? this.vehicleService
            .getById(trip.vehicleId)
            .pipe(catchError(() => of({ data: null } as WebApiResponse<any>)))
        : of({ data: null } as WebApiResponse<any>),
      driver: trip.driverId
        ? this.driverService
            .getById(trip.driverId)
            .pipe(catchError(() => of({ data: null } as WebApiResponse<any>)))
        : of({ data: null } as WebApiResponse<any>),
      passengers: this.passengerService
        .getByTrip(trip.id!)
        .pipe(catchError(() => of({ data: [] } as WebApiResponse<any>))),
      serviceOrders: trip.driverId
        ? this.serviceOrderService
            .getByDriver(trip.driverId)
            .pipe(catchError(() => of({ data: [] } as WebApiResponse<any>)))
        : of({ data: [] } as WebApiResponse<any>),
    }).subscribe({
      next: ({ vehicle, driver, passengers, serviceOrders }) => {
        this.emittingServiceOrder = false;
        const matchingServiceOrder = (serviceOrders.data ?? []).find(
          (so: any) => so.tripId === trip.id,
        );
        const commissionAmount = matchingServiceOrder?.commission?.amount ?? null;
        buildServiceOrderPages(
          this.documentTemplateService,
          trip,
          vehicle.data ?? null,
          driver.data ?? null,
          (passengers.data ?? []).length,
          commissionAmount,
        ).subscribe((pages) => {
          downloadLetterheadPdf(pages, `os-${trip.tripNumber}.pdf`);
        });
      },
      error: () => {
        this.emittingServiceOrder = false;
      },
    });
  }

  private getTripById(id: string): void {
    this.loading = true;
    this._tripChangedSub = merge(
      this.tripService.tripChanged$,
      this.paymentService.paymentChanged$,
    )
      .pipe(
        switchMap(() => this.tripService.getById(id)),
        takeUntil(this._destroy$),
      )
      .subscribe({
        next: (response: WebApiResponse<Trip>) => {
          this.loading = false;
          if (response.data == null) {
            this.routerService.navigateByUrl('/not-found');
            return;
          }
          this.data = response.data;
        },
        error: () => {
          this.loading = false;
          this.routerService.navigateByUrl('/not-found');
        },
      });
  }
}
