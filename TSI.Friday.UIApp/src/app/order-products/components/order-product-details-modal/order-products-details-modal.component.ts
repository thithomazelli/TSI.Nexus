import { Component, Inject, Output, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ApiService,
  FormBaseComponent,
  ModalService,
  WebApiResponse,
  NotificationService,
  ApiType,
} from '@friday/core';
import { OrderProduct } from '@friday/core';

@Component({
  selector: 'app-order-product-details-modal',
  standalone: false,
  templateUrl: './order-products-details-modal.component.html',
  styleUrl: './order-products-details-modal.component.scss',
})
export class OrderProductsDetailsModalComponent extends FormBaseComponent {
  @Output()
  saved = new EventEmitter<OrderProduct>();

  isEdit = false;
  data?: OrderProduct | null = null;
  id: number | null = null;
  parentId: number | null = null;
  parentData: any;
  private _baseEndPoint = ApiType.OrderProducts;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<OrderProductsDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    super();
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? null;
      this.id = dialogData.id ?? null;
      this.parentId = dialogData.parentId ?? null;
      this.parentData = dialogData.parentData ?? null;
    }
  }

  save(orderProduct: OrderProduct): void {
    if (!this.parentId) {
      this.saved.emit(orderProduct);
      return;
    }

    orderProduct.orderId = this.parentId ?? undefined;

    if (this.isEdit && this.id) {
      this.apiService
        .put<
          WebApiResponse<OrderProduct>
        >(`${this._baseEndPoint}/update`, orderProduct)
        .subscribe((response: WebApiResponse<OrderProduct>) => {
          this.saved.emit();
          this.modalService.hideModal(this.dialogRef);
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
        });
    } else {
      this.apiService
        .post<
          WebApiResponse<OrderProduct>
        >(`${this._baseEndPoint}/add`, orderProduct)
        .subscribe((response: WebApiResponse<OrderProduct>) => {
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
