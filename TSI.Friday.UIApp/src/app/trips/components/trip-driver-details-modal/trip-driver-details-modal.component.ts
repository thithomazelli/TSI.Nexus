import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TripDriver } from '@friday/core';

@Component({
  selector: 'app-trip-driver-details-modal',
  templateUrl: './trip-driver-details-modal.component.html',
  styleUrl: './trip-driver-details-modal.component.scss',
  standalone: false,
})
export class TripDriverDetailsModalComponent {
  isEdit = false;
  data?: TripDriver | null = null;
  id: string | null = null;
  parentId: string | null = null;
  parentData: any;

  constructor(
    public dialogRef: MatDialogRef<TripDriverDetailsModalComponent>,
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
