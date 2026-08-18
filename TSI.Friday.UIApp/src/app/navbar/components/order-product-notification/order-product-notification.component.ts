import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ModalService, OrderProductService, TranslationService } from '@friday/core';
import { OrderProductsDetailsModalComponent } from '../../../order-products/components/order-product-details-modal/order-products-details-modal.component';
import {
  ApiType,
  OrderProduct,
  OrderProductStatus,
  WebApiResponse,
} from '@friday/core';
import { Subject, Subscription, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-order-product-notification',
  templateUrl: './order-product-notification.component.html',
  styleUrl: './order-product-notification.component.scss',
  standalone: false,
})
export class OrderProductNotificationComponent implements OnInit, OnDestroy {
  orderProducts: OrderProduct[] = [];
  total: number = 0;

  private _statusIconMap: Record<OrderProductStatus, string> = {
    [OrderProductStatus.Delayed]: 'bi bi-exclamation-triangle-fill text-danger',
    [OrderProductStatus.InProgress]: 'bi bi-hourglass-split text-info',
    [OrderProductStatus.Returned]: 'bi bi-arrow-counterclockwise text-success',
  };

  private get _statusTextMap(): Record<OrderProductStatus, string> {
    return {
      [OrderProductStatus.Delayed]: this.translationService.instant('NAVBAR.DELIVERY_DELAYED'),
      [OrderProductStatus.InProgress]: this.translationService.instant('NAVBAR.DELIVERY_IN_PROGRESS'),
      [OrderProductStatus.Returned]: this.translationService.instant('NAVBAR.PRODUCT_RETURNED'),
    };
  }

  private _orderProductChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private orderProductService: OrderProductService,
    private modalService: ModalService,
    private router: Router,
    private translationService: TranslationService,
  ) {}

  ngOnInit(): void {
    this._orderProductChangedSub = this.orderProductService.orderProductChanged$
      .pipe(
        switchMap(() => this.orderProductService.getDelayed()),
        takeUntil(this._destroy$),
      )
      .subscribe((response: WebApiResponse<OrderProduct[]>) => {
        this.orderProducts = response?.data || [];
        this.total = this.orderProducts.length;
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._orderProductChangedSub) {
      this._orderProductChangedSub.unsubscribe();
    }
  }

  get displayOrderProducts(): OrderProduct[] {
    return this.orderProducts.slice(0, 10);
  }

  get showBadge(): boolean {
    return this.total > 0;
  }

  get showSeeMore(): boolean {
    return this.total > 10;
  }

  getStatusIcon(orderProduct: OrderProduct): string {
    return (
      this._statusIconMap[orderProduct.status] ||
      'bi bi-check-circle-fill text-success'
    );
  }

  getStatusText(orderProduct: OrderProduct): string {
    return this._statusTextMap[orderProduct.status] || this.translationService.instant('NAVBAR.UNKNOWN_STATUS');
  }

  getRelativeDate(date?: Date): string {
    if (!date) {
      return '';
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    if (diffDays === 0) {
      return this.translationService.instant('NAVBAR.TODAY');
    }
    if (diffDays === 1) {
      return this.translationService.instant('NAVBAR.YESTERDAY');
    }
    return this.translationService.instant('NAVBAR.DAYS_AGO', { days: diffDays + '' });
  }

  openModal(orderProduct: OrderProduct) {
    this.modalService.showTemplateModal(OrderProductsDetailsModalComponent, {
      isEdit: true,
      id: orderProduct.id,
      data: orderProduct,
      parentId: orderProduct.orderId,
    });
  }

  onSeeMore() {
    // Pass filters: status=InProgress,Delayed and endDate=today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const endDate = `${yyyy}-${mm}-${dd}`;
    this.router.navigate(['/order-products'], {
      queryParams: {
        status: 'InProgress,Delayed',
        endDate,
      },
    });
  }
}
