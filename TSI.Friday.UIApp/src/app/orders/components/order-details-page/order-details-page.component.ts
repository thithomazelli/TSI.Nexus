import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Order,
  ApiService,
  ApiType,
  NotificationService,
  WebApiResponse,
} from '@friday/core';

@Component({
  selector: 'app-order-details-page',
  standalone: false,
  templateUrl: './order-details-page.component.html',
  styleUrl: './order-details-page.component.scss',
})
export class OrderDetailsPageComponent {
  isEdit = false;
  data?: Order | null = null;
  id: string | null = null;
  loading = false;
  errorMessages?: string[];
  private _baseEndPoint: ApiType = ApiType.Orders;

  activeTab: 'resumo' | 'produtos' | 'pagamentos' = 'resumo';

  constructor(
    private activatedRoute: ActivatedRoute,
    private routerService: Router,
    private apiService: ApiService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = idParam;
      this.loadOrder(Number(idParam));
    } else {
      this.isEdit = false;
      this.data = null;
    }
  }

  onSave(order: Order): void {
    if (this.isEdit && this.id) {
      this.apiService
        .put<WebApiResponse<Order>>(`${this._baseEndPoint}/update`, order)
        .subscribe((response: WebApiResponse<Order>) => {
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
        });
    } else {
      this.apiService
        .post<WebApiResponse<Order>>(`${this._baseEndPoint}/add`, order)
        .subscribe((response: WebApiResponse<Order>) => {
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
          if (response.data && response.data.id) {
            this.routerService.navigate([`/orders/${response.data.id}`]);
          }
        });
    }
  }

  onCancel(): void {
    this.routerService.navigate([`/${this._baseEndPoint}`]);
  }

  onOrderProductsUpdated() {
    if (this.id) {
      this.loadOrder(Number(this.id));
    }
  }

  private loadOrder(id: number): void {
    this.loading = true;
    this.apiService
      .get<WebApiResponse<Order>>(`${this._baseEndPoint}/getById/${id}`)
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
