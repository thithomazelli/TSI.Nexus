import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ApiService,
  ApiType,
  ModalService,
  Payment,
  PaymentInstallment,
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
      payment.installments = [];

      for (let i = 0; i < (payment.totalOfInstallments || 0); i++) {
        const originalDate = new Date(
          payment.date ? new Date(payment.date) : new Date(),
        );
        const nextMonth = new Date(originalDate);
        nextMonth.setMonth(nextMonth.getMonth() + i + 1);

        const installment = <PaymentInstallment>{
          type: payment.type,
          method: payment.method,
          status: payment.status,
          date: i == 0 ? payment.date : nextMonth,
          category: payment.category,
          description: `${payment.description} - Parcela ${i + 1}`,
          price: payment.price
            ? payment.price / (payment.totalOfInstallments || 1)
            : 0,
          condition: payment.condition,
          installmentNumber: i + 1,
          orderId: payment.orderId,
          clientId: payment.clientId,
        };

        payment.installments.push(installment);
      }

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
