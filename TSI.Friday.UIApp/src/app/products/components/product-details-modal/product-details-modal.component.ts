import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ApiService,
  ApiType,
  GridService,
  ModalService,
  Product,
  WebApiResponse,
} from '@friday/core';

@Component({
  selector: 'app-product-details-modal',
  standalone: false,
  templateUrl: './product-details-modal.component.html',
  styleUrl: './product-details-modal.component.scss',
})
export class ProductDetailsModalComponent {
  isEdit = false;
  data?: Product | null = null;
  id: number | null = null;

  private _baseEndPoint: ApiType = ApiType.Products;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private gridService: GridService,
    @Inject(MAT_DIALOG_DATA) public dialogData: any
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
          this.gridService.gridDataChanged(response.data, this.id);
          this.modalService.hideModal();
          this.modalService.showSweetNotification(
            '',
            response.message,
            'success'
          );
        });
    } else {
      this.apiService
        .post<WebApiResponse<Product>>(`${this._baseEndPoint}/add`, product)
        .subscribe((response: WebApiResponse<Product>) => {
          this.gridService.gridDataChanged(response.data, null);
          this.modalService.hideModal();
          this.modalService.showSweetNotification(
            'Produto atualizado',
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
