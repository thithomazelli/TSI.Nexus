import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation',
  standalone: false,
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss',
})
export class ConfirmationComponent<T> {
  title: string;
  message: string;
  data: T | undefined;
  confirmDelete!: () => void;

  constructor(
    public dialogRef: MatDialogRef<ConfirmationComponent<T>>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any
  ) {
    this.title = dialogData.title || 'Confirmação';
    this.message =
      dialogData.message || 'Tem certeza que deseja excluir este item?';
    this.data = dialogData.data;
    this.confirmDelete = dialogData.confirmDelete;
  }
}
