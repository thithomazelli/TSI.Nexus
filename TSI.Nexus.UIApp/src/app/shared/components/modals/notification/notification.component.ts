import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
@Component({
  selector: 'modal-notification',
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
  standalone: false,
})
export class NotificationComponent {
  isSuccess: boolean;
  title: string;
  message: string;

  constructor(
    public dialogRef: MatDialogRef<NotificationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isSuccess = data.isSuccess;
    this.title = data.title;
    this.message = data.message;
  }
}
