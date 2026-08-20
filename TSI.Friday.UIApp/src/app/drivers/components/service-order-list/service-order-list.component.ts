import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import {
  Commission,
  CommissionService,
  CommissionStatus,
  NotificationService,
  ServiceOrder,
  ServiceOrderService,
  WebApiResponse,
} from '@friday/core';
import { Subject, takeUntil } from 'rxjs';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-service-order-list',
    templateUrl: './service-order-list.component.html',
    styleUrl: './service-order-list.component.scss',
    imports: [
        CurrencyPipe,
        DatePipe,
        TranslatePipe,
    ],
})
export class ServiceOrderListComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  driverId!: string;

  serviceOrders: ServiceOrder[] = [];

  statusMap: { [key: string]: { label: string; color: string } } = {
    Pending: { label: 'Pendente', color: 'warning' },
    Paid: { label: 'Paga', color: 'success' },
    Cancelled: { label: 'Cancelada', color: 'secondary' },
  };

  private _destroy$ = new Subject<void>();

  constructor(
    private commissionService: CommissionService,
    private notificationService: NotificationService,
    private serviceOrderService: ServiceOrderService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['driverId'] && !changes['driverId'].firstChange) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  getStatusInfo(status?: string): { label: string; color: string } {
    return this.statusMap[status ?? ''] ?? { label: status ?? '', color: 'secondary' };
  }

  markAsPaid(commission: Commission): void {
    const updated: Commission = { ...commission, status: CommissionStatus.Paid };

    this.commissionService
      .update(updated)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Commission>) => {
        this.notificationService.showMessage(response.status, response.message);
        this.load();
      });
  }

  private load(): void {
    if (!this.driverId) {
      return;
    }
    this.serviceOrderService
      .getByDriver(this.driverId)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response) => {
        this.serviceOrders = response.data ?? [];
      });
  }
}
