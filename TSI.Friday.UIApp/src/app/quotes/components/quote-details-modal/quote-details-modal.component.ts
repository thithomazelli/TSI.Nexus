import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Quote } from '@friday/core';

@Component({
  selector: 'app-quote-details-modal',
  templateUrl: './quote-details-modal.component.html',
  styleUrl: './quote-details-modal.component.scss',
  standalone: false,
})
export class QuoteDetailsModalComponent {
  isEdit = false;
  data?: Quote | null = <Quote>{
    quoteProducts: [],
  };
  id: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<QuoteDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? this.data;
      this.id = dialogData.id ?? null;
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
