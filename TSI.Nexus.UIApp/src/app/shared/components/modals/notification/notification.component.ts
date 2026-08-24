import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NgIf } from '@angular/common';
@Component({
    selector: 'modal-notification',
    templateUrl: './notification.component.html',
    styleUrl: './notification.component.scss',
    imports: [NgIf],
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
