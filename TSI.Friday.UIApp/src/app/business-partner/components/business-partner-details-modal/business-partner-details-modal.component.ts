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
  BusinessPartner,
} from '@friday/core';

@Component({
  selector: 'app-business-partner-details-modal',
  templateUrl: './business-partner-details-modal.component.html',
  styleUrl: './business-partner-details-modal.component.scss',
  standalone: false,
})
export class BusinessPartnerDetailsModalComponent extends FormBaseComponent {
  @Output()
  saved = new EventEmitter<void>();

  isEdit = false;
  data?: Individual | Company | null = <BusinessPartner>{};
  id: string | null = null;

  private _baseEndPoint: ApiType = ApiType.BusinessPartners;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    public dialogRef: MatDialogRef<BusinessPartnerDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    super();
    // Recebe dados do modal
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? <BusinessPartner>{};
      this.id = dialogData.id ?? null;
    }
  }

  save(businessPartner: Company | Individual): void {
    this._baseEndPoint =
      businessPartner.documentType === 'Física'
        ? ApiType.Individuals
        : ApiType.Companies;

    if (this.isEdit && this.id) {
      this.apiService
        .put<
          WebApiResponse<Company | Individual>
        >(`${this._baseEndPoint}/update`, businessPartner)
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
        >(`${this._baseEndPoint}/add`, businessPartner)
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
