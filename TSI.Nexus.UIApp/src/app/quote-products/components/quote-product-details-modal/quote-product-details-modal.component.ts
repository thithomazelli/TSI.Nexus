import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { QuoteProduct } from '@nexus/core';

@Component({
  selector: 'app-quote-product-details-modal',
  standalone: false,
  templateUrl: './quote-product-details-modal.component.html',
  styleUrl: './quote-product-details-modal.component.scss',
})
export class QuoteProductDetailsModalComponent {
  isEdit = false;
  data?: QuoteProduct | null = null;
  id: string | null = null;
  parentId: string | null = null;
  parentData: any;

  constructor(
    public dialogRef: MatDialogRef<QuoteProductDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? null;
      this.id = dialogData.id ?? null;
      this.parentId = dialogData.parentId ?? null;
      this.parentData = dialogData.parentData ?? null;
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
