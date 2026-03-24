import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ApiService,
  ApiType,
  ModalService,
  Product,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';

@Component({
  selector: 'app-product-details-modal',
  standalone: false,
  templateUrl: './product-details-modal.component.html',
  styleUrl: './product-details-modal.component.scss',
})
export class ProductDetailsModalComponent {
  @Output()
  saved = new EventEmitter<void>();

  isEdit = false;
  data?: Product | null = null;
  id: string | null = null;
  private _baseEndPoint: ApiType = ApiType.Products;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    public dialogRef: MatDialogRef<ProductDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? null;
      this.id = dialogData.id ?? null;
    }
  }

  save(product: Product): void {
    if (this.isEdit && this.id) {
      this.apiService
        .put<WebApiResponse<Product>>(`${this._baseEndPoint}/update`, product)
        .subscribe((response: WebApiResponse<Product>) => {
          this.saved.emit();
          this.dialogRef.close(response);
          this.modalService.showNotification(
            response.status == ResponseStatus.Success,
            '',
            response.message,
          );
        });
    } else {
      this.apiService
        .post<WebApiResponse<Product>>(`${this._baseEndPoint}/add`, product)
        .subscribe((response: WebApiResponse<Product>) => {
          this.saved.emit();
          this.dialogRef.close(response);
          this.modalService.showNotification(
            response.status == ResponseStatus.Success,
            '',
            response.message,
          );
        });
    }
  }

  close(): void {
    this.modalService.hideModal(this.dialogRef);
  }
}
