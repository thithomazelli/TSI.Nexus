import { Component, Input } from '@angular/core';
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
  ResponseStatus,
} from '@friday/core';

@Component({
  selector: 'app-client-details-modal',
  standalone: false,
  templateUrl: './client-details-modal.component.html',
  styleUrl: './client-details-modal.component.scss',
})
export class ClientDetailsModalComponent extends FormBaseComponent {
  @Input()
  isEdit = false;

  @Input()
  data?: Individual | Company | null = null;

  @Input()
  id: number | null = null;

  private _baseEndPoint: ApiType = ApiType.Clients;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private gridService: GridService
  ) {
    super();
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
          this.notificationService.showMessage(
            response.status,
            response.message
          );
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
