import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ApiService,
  ApiType,
  FormBaseComponent,
  GridService,
  ModalService,
  WebApiResponse,
  Individual,
  Company,
  NotificationService,
} from '@friday/core';

@Component({
  selector: 'app-client-details-modal',
  standalone: false,
  templateUrl: './client-details-modal.component.html',
  styleUrl: './client-details-modal.component.scss',
})
export class ClientDetailsModalComponent extends FormBaseComponent {
  isEdit = false;
  data?: Individual | Company | null = null;
  id: number | null = null;

  private _baseEndPoint: ApiType = ApiType.Clients;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private gridService: GridService,
    @Inject(MAT_DIALOG_DATA) public dialogData: any
  ) {
    super();
    // Recebe dados do modal
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? null;
      this.id = dialogData.id ?? null;
    }
  }

  save(client: Individual | Company): void {
    this._baseEndPoint =
      client.type === 'Física' ? ApiType.Individuals : ApiType.Companies;

    if (this.isEdit && this.id) {
      this.apiService
        .put<WebApiResponse<Company | Individual>>(
          `${this._baseEndPoint}/update`,
          client
        )
        .subscribe((response: WebApiResponse<Company | Individual>) => {
          this.gridService.gridDataChanged(response.data, this.id);
          this.modalService.showSweetNotification(
            '',
            response.message,
            'success'
          );
          this.modalService.hideModal();
        });
    } else {
      this.apiService
        .post<WebApiResponse<Company | Individual>>(
          `${this._baseEndPoint}/add`,
          client
        )
        .subscribe((response: WebApiResponse<Company | Individual>) => {
          this.gridService.gridDataChanged(response.data, null);
          this.modalService.hideModal();
          this.modalService.showSweetNotification(
            '',
            response.message,
            'success'
          );
        });
    }
  }

  close(): void {
    this.modalService.hideModal();
  }
}
