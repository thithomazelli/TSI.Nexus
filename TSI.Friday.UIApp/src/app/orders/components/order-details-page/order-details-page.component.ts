import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Order, ApiService, ApiType, NotificationService, GridService, WebApiResponse } from '@friday/core';

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

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private notificationService: NotificationService,
    private gridService: GridService
  ) {}

  ngOnInit(): void {
    const idParam = this.activatedRoute.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = idParam;
      // Aqui você pode buscar os dados do pedido pelo id
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
          this.gridService.gridDataChanged(response.data, this.id);
          this.notificationService.showMessage(
            response.status,
            response.message
          );
        });
    } else {
      this.apiService
        .post<WebApiResponse<Order>>(`${this._baseEndPoint}/add`, order)
        .subscribe((response: WebApiResponse<Order>) => {
          this.gridService.gridDataChanged(response.data, null);
          this.notificationService.showMessage(
            response.status,
            response.message
          );
        });
    }
  }

  onCancel(): void {
    this.router.navigate(['/orders']);
  }
}
