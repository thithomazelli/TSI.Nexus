import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ApiService,
  ApiType,
  FormBaseComponent,
  ModalService,
  WebApiResponse,
  Individual,
  Company,
  Client,
} from '@friday/core';

@Component({
  selector: 'app-client-details-modal',
  standalone: false,
  templateUrl: './client-details-modal.component.html',
  styleUrl: './client-details-modal.component.scss',
})
export class ClientDetailsModalComponent extends FormBaseComponent {
  @Output()
  saved = new EventEmitter<void>();

  isEdit = false;
  data?: Individual | Company | null = <Client>{};
  id: number | null = null;

  private _baseEndPoint: ApiType = ApiType.Clients;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    public dialogRef: MatDialogRef<ClientDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    super();
    // Recebe dados do modal
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? <Client>{};
      this.id = dialogData.id ?? null;
    }
  }

  save(client: Individual | Company): void {
    this._baseEndPoint =
      client.type === 'Física' ? ApiType.Individuals : ApiType.Companies;

    if (this.isEdit && this.id) {
      this.apiService
        .put<
          WebApiResponse<Company | Individual>
        >(`${this._baseEndPoint}/update`, client)
        .subscribe((response: WebApiResponse<Company | Individual>) => {
          this.saved.emit();
          this.modalService.showSweetNotification(
            '',
            response.message,
            response.status,
          );
          this.modalService.hideModal(this.dialogRef);
        });
    } else {
      this.apiService
        .post<
          WebApiResponse<Company | Individual>
        >(`${this._baseEndPoint}/add`, client)
        .subscribe((response: WebApiResponse<Company | Individual>) => {
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
