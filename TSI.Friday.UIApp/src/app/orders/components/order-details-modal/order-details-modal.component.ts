import { Component, Input } from '@angular/core';
import {
  FormBaseComponent,
  Order,
  ApiService,
  ApiType,
  NotificationService,
  GridService,
  ModalService,
  WebApiResponse,
} from '@friday/core';

@Component({
  selector: 'app-order-details-modal',
  standalone: false,
  templateUrl: './order-details-modal.component.html',
  styleUrl: './order-details-modal.component.scss',
})
export class OrderDetailsModalComponent extends FormBaseComponent {
  @Input()
  isEdit = false;

  @Input()
  data?: Order | null = null;

  @Input()
  id: number | null = null;

  private _baseEndPoint: ApiType = ApiType.Orders;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    private gridService: GridService,
    private modalService: ModalService
  ) {
    super();
  }

  save(order: Order): void {
    if (this.isEdit && this.id) {
      this.apiService
        .put<WebApiResponse<Order>>(`${this._baseEndPoint}/update`, order)
        .subscribe((response: WebApiResponse<Order>) => {
          this.gridService.gridDataChanged(response.data, this.id);
          this.modalService.hideModal();
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
          this.modalService.hideModal();
          this.notificationService.showMessage(
            response.status,
            response.message
          );
        });
    }
  }

  close(): void {
    this.modalService.hideModal();
  }
}
