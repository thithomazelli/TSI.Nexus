import { Component, Input, Output, EventEmitter } from '@angular/core';

import {
  ApiService,
  ApiType,
  FormBaseComponent,
  GridService,
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
  @Input()
  isEdit = false;

  @Input()
  data?: Address | null = null;

  @Input()
  id: number | null = null;

  @Input()
  parentId: number | null = null;

  private _baseEndPoint: ApiType = ApiType.Addresses;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private gridService: GridService
  ) {
    super();
  }

  save(address: Address): void {
    address.clientId = this.parentId;

    if (this.isEdit && this.id) {
      this.apiService
        .put<WebApiResponse<Address>>(`${this._baseEndPoint}/update`, address)
        .subscribe((response: WebApiResponse<Address>) => {
          this.gridService.gridDataChanged(response.data, this.id);
          this.modalService.hideModal();
          this.notificationService.showMessage(
            response.status,
            response.message
          );
        });
    } else {
      this.apiService
        .post<WebApiResponse<Address>>(`${this._baseEndPoint}/add`, address)
        .subscribe((response: WebApiResponse<Address>) => {
          this.gridService.gridDataChanged(response.data, this.id);
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
