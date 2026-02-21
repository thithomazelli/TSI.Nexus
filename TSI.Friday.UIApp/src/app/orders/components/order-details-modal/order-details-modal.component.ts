import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  FormBaseComponent,
  Order,
  ApiService,
  ApiType,
  NotificationService,
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
  @Output()
  saved = new EventEmitter<void>();

  isEdit = false;

  data?: Order | null = <Order>{
    orderProducts: [],
  };

  id: number | null = null;
  private _baseEndPoint: ApiType = ApiType.Orders;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    private modalService: ModalService,
    public dialogRef: MatDialogRef<OrderDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    super();
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? this.data;
      this.id = dialogData.id ?? null;
    }
  }

  save(order: Order): void {
    if (this.isEdit && this.id) {
      this.apiService
        .put<WebApiResponse<Order>>(`${this._baseEndPoint}/update`, order)
        .subscribe((response: WebApiResponse<Order>) => {
          this.saved.emit();
          this.modalService.hideModal(this.dialogRef);
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
        });
    } else {
      this.apiService
        .post<WebApiResponse<Order>>(`${this._baseEndPoint}/add`, order)
        .subscribe((response: WebApiResponse<Order>) => {
          this.saved.emit();
          this.modalService.hideModal(this.dialogRef);
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
        });
    }
  }

  close(): void {
    this.modalService.hideModal(this.dialogRef);
  }
}
