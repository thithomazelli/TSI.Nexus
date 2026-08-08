import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Vehicle } from '@friday/core';

@Component({
  selector: 'app-vehicle-details-modal',
  templateUrl: './vehicle-details-modal.component.html',
  styleUrl: './vehicle-details-modal.component.scss',
  standalone: false,
})
export class VehicleDetailsModalComponent implements OnInit {
  isEdit = false;
  data?: Vehicle | null = <Vehicle>{};
  id: string | null = null;

  title = '';

  constructor(
    public dialogRef: MatDialogRef<VehicleDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    if (dialogData) {
      this.isEdit = dialogData.isEdit ?? false;
      this.data = dialogData.data ?? <Vehicle>{};
      this.id = dialogData.id ?? null;
    }
  }

  ngOnInit(): void {
    this.title = this.isEdit ? 'Editar Veículo' : 'Adicionar Veículo';
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
