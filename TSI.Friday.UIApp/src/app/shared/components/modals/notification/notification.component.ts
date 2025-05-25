import { Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    selector: 'app-notification',
    templateUrl: './notification.component.html',
    styleUrl: './notification.component.scss',
    standalone: false
})
export class NotificationComponent {
  isSuccess: boolean = true;
  title: string = '';
  message: string = '';

  constructor(public bsModalRef: BsModalRef) {}
}
