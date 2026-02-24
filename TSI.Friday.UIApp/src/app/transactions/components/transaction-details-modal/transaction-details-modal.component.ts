import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ApiService,
  ApiType,
  ModalService,
  Transaction,
  Payment,
  WebApiResponse,
} from '@friday/core';

@Component({
  selector: 'app-transaction-details-modal',
  standalone: false,
  templateUrl: './transaction-details-modal.component.html',
  styleUrl: './transaction-details-modal.component.scss',
})
export class TransactionDetailsModalComponent {
  @Output()
  saved = new EventEmitter<void>();

  isEdit = false;
  data?: Transaction | null = null;
  id: string | null = null;

  private _baseEndPoint: ApiType = ApiType.Transactions;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    public dialogRef: MatDialogRef<TransactionDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? null;
      this.id = dialogData.id ?? null;
    }
  }

  save(payment: Transaction): void {
    if (this.isEdit && this.id) {
      this.apiService
        .put<
          WebApiResponse<Transaction>
        >(`${this._baseEndPoint}/update`, payment)
        .subscribe((response: WebApiResponse<Transaction>) => {
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
        .post<WebApiResponse<Transaction>>(`${this._baseEndPoint}/add`, payment)
        .subscribe((response: WebApiResponse<Transaction>) => {
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
