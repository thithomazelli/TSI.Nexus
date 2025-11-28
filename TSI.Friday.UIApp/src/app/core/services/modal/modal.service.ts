import { Injectable, TemplateRef, Type } from '@angular/core';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { NotificationComponent } from '../../../shared/components/modals/notification/notification.component';
import { ConfirmationComponent } from '../../../shared/components/modals/confirmation/confirmation.component';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private bsModalRef?: BsModalRef;

  constructor(private bsModalService: BsModalService) {}

  showTemplateModal<T>(
    template: TemplateRef<T> | Type<T>,
    initialState?: ModalOptions<T>
  ) {
    this.bsModalRef = this.bsModalService.show(template, initialState);
  }

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

  showConfirmation(initialState: ModalOptions) {
    this.bsModalRef = this.bsModalService.show(
      ConfirmationComponent,
      initialState
    );
  }

  hideModal(): void {
    this.bsModalRef?.hide();
  }
}
