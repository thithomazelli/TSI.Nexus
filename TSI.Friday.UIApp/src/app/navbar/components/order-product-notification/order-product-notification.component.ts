import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ModalService, OrderProductService } from '@friday/core';
import { OrderProductsDetailsModalComponent } from '../../../order-products/components/order-product-details-modal/order-products-details-modal.component';
import {
  ApiService,
  ApiType,
  OrderProduct,
  OrderProductStatus,
  WebApiResponse,
} from '@friday/core';
import { filter, merge, mergeMap } from 'rxjs';

@Component({
  selector: 'app-order-product-notification',
  templateUrl: './order-product-notification.component.html',
  styleUrl: './order-product-notification.component.scss',
  standalone: false,
})
export class OrderProductNotificationComponent implements OnInit, OnDestroy {
  private subscription: any;
  orderProducts: OrderProduct[] = [];
  total: number = 0;

  private _baseEndPoint = ApiType.OrderProducts;

  private _statusIconMap: Record<OrderProductStatus, string> = {
    [OrderProductStatus.Delayed]: 'bi bi-exclamation-triangle-fill text-danger',
    [OrderProductStatus.InProgress]: 'bi bi-hourglass-split text-info',
    [OrderProductStatus.Returned]: 'bi bi-arrow-counterclockwise text-success',
  };

  private _statusTextMap: Record<OrderProductStatus, string> = {
    [OrderProductStatus.Delayed]: 'Entrega atrasada',
    [OrderProductStatus.InProgress]: 'Entrega em andamento',
    [OrderProductStatus.Returned]: 'Produto devolvido',
  };

  constructor(
    private apiService: ApiService,
    private orderProductService: OrderProductService,
    private modalService: ModalService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.subscription = merge(
      this.apiService.get<WebApiResponse<OrderProduct[]>>(
        `${this._baseEndPoint}/getDelayed`,
      ),
      this.orderProductService.hasOrderProductChanged().pipe(
        filter((changed) => changed === true),
        mergeMap(() =>
          this.apiService.get<WebApiResponse<OrderProduct[]>>(
            `${this._baseEndPoint}/getDelayed`,
          ),
        ),
      ),
    ).subscribe({
      next: (response: WebApiResponse<OrderProduct[]>) => {
        this.orderProducts = response?.data || [];
        this.total = this.orderProducts.length;
      },
      error: () => {
        this.orderProducts = [];
        this.total = 0;
      },
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
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
    return this._statusTextMap[orderProduct.status] || 'Status desconhecido';
  }

  getRelativeDate(date?: Date): string {
    if (!date) {
      return '';
    }

    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.abs(Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    if (diffDays === 0) {
      return 'Hoje';
    }
    if (diffDays === 1) {
      return 'Ontem';
    }
    return `${diffDays} dias atrás`;
  }

  onOpenModal(orderProduct: OrderProduct) {
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
