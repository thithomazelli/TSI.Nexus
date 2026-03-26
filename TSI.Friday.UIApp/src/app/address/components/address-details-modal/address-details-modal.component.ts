import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Address } from '@friday/core';

@Component({
  selector: 'app-address-details-modal',
  standalone: false,
  templateUrl: './address-details-modal.component.html',
  styleUrl: './address-details-modal.component.scss',
})
export class AddressDetailsModalComponent {
  isEdit = false;
  data?: Address | null = null;
  id: string | null = null;
  parentId: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<AddressDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? null;
      this.id = dialogData.id ?? null;
      this.parentId = dialogData.parentId ?? null;
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
