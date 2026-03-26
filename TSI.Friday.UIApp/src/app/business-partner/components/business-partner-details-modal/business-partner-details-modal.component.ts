import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Individual, Company, BusinessPartner } from '@friday/core';

@Component({
  selector: 'app-business-partner-details-modal',
  templateUrl: './business-partner-details-modal.component.html',
  styleUrl: './business-partner-details-modal.component.scss',
  standalone: false,
})
export class BusinessPartnerDetailsModalComponent {
  isEdit = false;
  data?: Individual | Company | null = <BusinessPartner>{};
  id: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<BusinessPartnerDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? <BusinessPartner>{};
      this.id = dialogData.id ?? null;
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
