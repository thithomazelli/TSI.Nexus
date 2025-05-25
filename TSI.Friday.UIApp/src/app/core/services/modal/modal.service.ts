import { Injectable } from '@angular/core';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { NotificationComponent } from '../../../shared/components/modals/notification/notification.component';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  bsModalRef?: BsModalRef;

  constructor(private bsModalService: BsModalService) {}

  showNotification(isSuccess: boolean, title: string, message: string) {
    const initialState: ModalOptions = {
      initialState: {
        isSuccess,
        title,
        message,
      },
    };

    this.bsModalRef = this.bsModalService.show(
      NotificationComponent,
      initialState
    );
  }
}
