import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  Attachment,
  AttachmentService,
  NotificationService,
  Passenger,
  PassengerService,
  ResponseStatus,
} from '@friday/core';
import { forkJoin } from 'rxjs';

import { parsePassengerRows } from '../../utilities/passenger-import-parser';

@Component({
  selector: 'app-passenger-import',
  templateUrl: './passenger-import.component.html',
  styleUrl: './passenger-import.component.scss',
  standalone: false,
})
export class PassengerImportComponent {
  orderId: string;

  selectedFile: File | null = null;
  previewPassengers: Passenger[] = [];
  importing = false;

  constructor(
    public dialogRef: MatDialogRef<PassengerImportComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private passengerService: PassengerService,
    private attachmentService: AttachmentService,
    private notificationService: NotificationService,
  ) {
    this.orderId = dialogData?.orderId ?? '';
  }

  close(): void {
    this.dialogRef.close(null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile = file;
    this.previewPassengers = [];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = (reader.result as string) ?? '';
      this.previewPassengers = parsePassengerRows(text, this.orderId);
    };
    reader.readAsText(file);
  }

  clearSelection(): void {
    this.selectedFile = null;
    this.previewPassengers = [];
  }

  confirmImport(): void {
    if (!this.selectedFile || this.previewPassengers.length === 0 || this.importing) {
      return;
    }

    this.importing = true;

    const attachment: Partial<Attachment> = {
      file: this.selectedFile,
      orderId: this.orderId,
    };

    forkJoin({
      passengers: this.passengerService.addRange(this.previewPassengers),
      attachment: this.attachmentService.add(attachment as Attachment),
    }).subscribe({
      next: ({ passengers }) => {
        this.importing = false;
        this.notificationService.showMessage(
          passengers.status,
          passengers.message,
        );
        if (passengers.status === ResponseStatus.Success) {
          this.dialogRef.close(true);
        }
      },
      error: () => {
        this.importing = false;
        this.notificationService.showMessage(
          'Error',
          'Erro ao importar a lista de passageiros.',
        );
      },
    });
  }
}
