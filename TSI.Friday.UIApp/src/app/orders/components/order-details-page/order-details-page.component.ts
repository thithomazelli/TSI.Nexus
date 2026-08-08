import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Order,
  WebApiResponse,
  OrderStatus,
  OrderService,
  OrderProductService,
  PaymentService,
  BusinessPartnerService,
  VehicleService,
  DriverService,
  TripLegService,
  PassengerService,
  ServiceOrderService,
  downloadLetterheadPdf,
} from '@friday/core';
import { Subject, Subscription, switchMap, takeUntil, merge, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { buildContractPages, buildServiceOrderPages } from '../../utilities/order-documents';

@Component({
  selector: 'app-order-details-page',
  templateUrl: './order-details-page.component.html',
  styleUrl: './order-details-page.component.scss',
  standalone: false,
})
export class OrderDetailsPageComponent implements OnInit, OnDestroy {
  isEdit = false;
  data?: Order | null = null;
  id: string | null = null;
  loading = false;

  activeTab:
    | 'details'
    | 'products'
    | 'triplegs'
    | 'passengers'
    | 'passenger-import'
    | 'payments'
    | 'attachments' = 'details';

  orderStatusOptions: Record<OrderStatus, string> = {
    [OrderStatus.Open]: 'Em aberto',
    [OrderStatus.Closed]: 'Finalizado',
    [OrderStatus.WaitingPayment]: 'Aguardando pagamento',
  };

  emittingContract = false;
  emittingServiceOrder = false;

  private _orderChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private orderService: OrderService,
    private orderProductService: OrderProductService,
    private paymentService: PaymentService,
    private routerService: Router,
    private businessPartnerService: BusinessPartnerService,
    private vehicleService: VehicleService,
    private driverService: DriverService,
    private tripLegService: TripLegService,
    private passengerService: PassengerService,
    private serviceOrderService: ServiceOrderService,
  ) {}

  ngOnInit(): void {
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = idParam;
      this.getOrderById(idParam);
    } else {
      this.isEdit = false;
      this.data = null;
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._orderChangedSub) {
      this._orderChangedSub.unsubscribe();
    }
  }

  getStatusLabel(): string {
    if (!this.data || this.data.status == null) {
      return '';
    }

    return this.orderStatusOptions[this.data?.status] || '';
  }

  emitContract(): void {
    if (!this.data || this.emittingContract) {
      return;
    }
    const order = this.data;
    this.emittingContract = true;

    forkJoin({
      businessPartner: order.businessPartnerId
        ? this.businessPartnerService
            .getById(order.businessPartnerId)
            .pipe(catchError(() => of({ data: null } as WebApiResponse<any>)))
        : of({ data: null } as WebApiResponse<any>),
      vehicle: order.vehicleId
        ? this.vehicleService
            .getById(order.vehicleId)
            .pipe(catchError(() => of({ data: null } as WebApiResponse<any>)))
        : of({ data: null } as WebApiResponse<any>),
      tripLegs: this.tripLegService
        .getByOrder(order.id!)
        .pipe(catchError(() => of({ data: [] } as WebApiResponse<any>))),
    }).subscribe({
      next: ({ businessPartner, vehicle, tripLegs }) => {
        this.emittingContract = false;
        const pages = buildContractPages(
          order,
          businessPartner.data ?? null,
          vehicle.data ?? null,
          tripLegs.data ?? [],
        );
        downloadLetterheadPdf(pages, `contrato-${order.orderNumber}.pdf`);
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
    const order = this.data;
    this.emittingServiceOrder = true;

    forkJoin({
      vehicle: order.vehicleId
        ? this.vehicleService
            .getById(order.vehicleId)
            .pipe(catchError(() => of({ data: null } as WebApiResponse<any>)))
        : of({ data: null } as WebApiResponse<any>),
      driver: order.driverId
        ? this.driverService
            .getById(order.driverId)
            .pipe(catchError(() => of({ data: null } as WebApiResponse<any>)))
        : of({ data: null } as WebApiResponse<any>),
      passengers: this.passengerService
        .getByOrder(order.id!)
        .pipe(catchError(() => of({ data: [] } as WebApiResponse<any>))),
      serviceOrders: order.driverId
        ? this.serviceOrderService
            .getByDriver(order.driverId)
            .pipe(catchError(() => of({ data: [] } as WebApiResponse<any>)))
        : of({ data: [] } as WebApiResponse<any>),
    }).subscribe({
      next: ({ vehicle, driver, passengers, serviceOrders }) => {
        this.emittingServiceOrder = false;
        const matchingServiceOrder = (serviceOrders.data ?? []).find(
          (so: any) => so.orderId === order.id,
        );
        const commissionAmount = matchingServiceOrder?.commission?.amount ?? null;
        const pages = buildServiceOrderPages(
          order,
          vehicle.data ?? null,
          driver.data ?? null,
          (passengers.data ?? []).length,
          commissionAmount,
        );
        downloadLetterheadPdf(pages, `os-${order.orderNumber}.pdf`);
      },
      error: () => {
        this.emittingServiceOrder = false;
      },
    });
  }

  private getOrderById(id: string): void {
    this.loading = true;
    this._orderChangedSub = merge(
      this.orderService.orderChanged$,
      this.orderProductService.orderProductChanged$,
      this.paymentService.paymentChanged$,
    )
      .pipe(
        switchMap(() => this.orderService.getById(id)),
        takeUntil(this._destroy$),
      )
      .subscribe({
        next: (response: WebApiResponse<Order>) => {
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
