import { Injectable, TemplateRef, Type } from '@angular/core';
import Swal from 'sweetalert2';
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
    return this.bsModalRef;
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

  // SweetAlert2: Alert simples
  showSweetNotification(
    title: string,
    text: string,
    icon: 'success' | 'error' | 'warning' | 'info' = 'info'
  ) {
    return Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: 'OK',
    });
  }

  showConfirmation(initialState: ModalOptions) {
    this.bsModalRef = this.bsModalService.show(
      ConfirmationComponent,
      initialState
    );
  }

  // SweetAlert2: Confirmação
  showSweetConfirmation(
    title: string,
    text: string,
    icon: 'warning' | 'question' = 'question',
    confirmButtonText = 'Sim',
    cancelButtonText = 'Cancelar'
  ) {
    return Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      confirmButtonColor: '#3085d6',
      cancelButtonText,
      cancelButtonColor: '#d33',
    });
  }

  hideModal(): void {
    this.bsModalRef?.hide();
  }
}
