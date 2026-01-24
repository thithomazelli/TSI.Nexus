import { Component, Inject, Output, EventEmitter } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import {
  ApiService,
  ApiType,
  FormBaseComponent,
  ModalService,
  WebApiResponse,
  Address,
  NotificationService,
} from '@friday/core';

@Component({
  selector: 'app-address-details-modal',
  standalone: false,
  templateUrl: './address-details-modal.component.html',
  styleUrl: './address-details-modal.component.scss',
})
export class AddressDetailsModalComponent extends FormBaseComponent {
  @Output() saved = new EventEmitter<void>();

  isEdit = false;
  data?: Address | null = null;
  id: number | null = null;
  parentId: number | null = null;
  private _baseEndPoint: ApiType = ApiType.Addresses;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<AddressDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    super();
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? null;
      this.id = dialogData.id ?? null;
      this.parentId = dialogData.parentId ?? null;
    }
  }

  save(address: Address): void {
    address.clientId = this.parentId;

    if (this.isEdit && this.id) {
      this.apiService
        .put<WebApiResponse<Address>>(`${this._baseEndPoint}/update`, address)
        .subscribe((response: WebApiResponse<Address>) => {
          this.saved.emit();
          this.modalService.hideModal(this.dialogRef);
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
        });
    } else {
      this.apiService
        .post<WebApiResponse<Address>>(`${this._baseEndPoint}/add`, address)
        .subscribe((response: WebApiResponse<Address>) => {
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
