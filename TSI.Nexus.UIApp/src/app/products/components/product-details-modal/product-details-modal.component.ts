import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Product } from '@nexus/core';

@Component({
  selector: 'app-product-details-modal',
  standalone: false,
  templateUrl: './product-details-modal.component.html',
  styleUrl: './product-details-modal.component.scss',
})
export class ProductDetailsModalComponent {
  isEdit = false;
  data?: Product | null = null;
  id: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ProductDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? null;
      this.id = dialogData.id ?? null;
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
