import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ApiService,
  ApiType,
  ModalService,
  Payment,
  WebApiResponse,
} from '@friday/core';

@Component({
  selector: 'app-payment-details-modal',
  standalone: false,
  templateUrl: './payment-details-modal.component.html',
  styleUrl: './payment-details-modal.component.scss',
})
export class PaymentDetailsModalComponent {
  @Output()
  saved = new EventEmitter<void>();

  isEdit = false;
  data?: Payment | null = null;
  id: number | null = null;

  private _baseEndPoint: ApiType = ApiType.Payments;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    public dialogRef: MatDialogRef<PaymentDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? null;
      this.id = dialogData.id ?? null;
    }
  }

  save(payment: Payment): void {
    if (this.isEdit && this.id) {
      this.apiService
        .put<WebApiResponse<Payment>>(`${this._baseEndPoint}/update`, payment)
        .subscribe((response: WebApiResponse<Payment>) => {
          this.saved.emit();
          this.modalService.hideModal(this.dialogRef);
          this.modalService.showSweetNotification(
            '',
            response.message,
            response.status,
          );
        });
    } else {
      this.apiService
        .post<WebApiResponse<Payment>>(`${this._baseEndPoint}/add`, payment)
        .subscribe((response: WebApiResponse<Payment>) => {
          this.saved.emit();
          this.modalService.hideModal(this.dialogRef);
          this.modalService.showSweetNotification(
            '',
            response.message,
            response.status,
          );
        });
    }
  }

  close(): void {
    this.modalService.hideModal(this.dialogRef);
  }
}
