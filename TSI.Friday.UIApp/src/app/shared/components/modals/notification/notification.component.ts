import { Component } from '@angular/core';
import { ModalService } from '@friday/core';
@Component({
  selector: 'modal-notification',
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
  standalone: false,
})
export class NotificationComponent {
  isSuccess: boolean = true;
  title: string = '';
  message: string = '';

  constructor(public modalService: ModalService) {}
}
