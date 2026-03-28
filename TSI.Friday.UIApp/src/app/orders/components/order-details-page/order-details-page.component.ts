import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Order, WebApiResponse, OrderStatus, OrderService } from '@friday/core';

@Component({
  selector: 'app-order-details-page',
  templateUrl: './order-details-page.component.html',
  styleUrl: './order-details-page.component.scss',
  standalone: false,
})
export class OrderDetailsPageComponent {
  isEdit = false;
  data?: Order | null = null;
  id: string | null = null;
  loading = false;

  activeTab: 'details' | 'products' | 'payments' = 'details';

  orderStatusOptions: Record<OrderStatus, string> = {
    [OrderStatus.Open]: 'Em aberto',
    [OrderStatus.Closed]: 'Finalizado',
    [OrderStatus.WaitingPayment]: 'Aguardando pagamento',
  };

  constructor(
    private activatedRoute: ActivatedRoute,
    private orderService: OrderService,
    private routerService: Router,
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

  getStatusLabel(): string {
    if (!this.data || this.data.status == null) {
      return '';
    }

    return this.orderStatusOptions[this.data?.status] || '';
  }

  private getOrderById(id: string): void {
    this.loading = true;
    this.orderService.getById(id).subscribe({
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
