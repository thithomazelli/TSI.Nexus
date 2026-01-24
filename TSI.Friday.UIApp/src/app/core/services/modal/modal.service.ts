import { Injectable, TemplateRef, Type, Inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { NotificationComponent } from '../../../shared/components/modals/notification/notification.component';
import { ConfirmationComponent } from '../../../shared/components/modals/confirmation/confirmation.component';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  // Removido suporte a ngx-bootstrap/modal
  constructor(private dialog: MatDialog) {}

  showTemplateModal<T>(
    componentOrTemplate: TemplateRef<T> | Type<T>,
    data?: any,
  ): MatDialogRef<any> {
    // Garante que id seja incluído em data
    const dialogData = { ...data };
    if (data?.id !== undefined) {
      dialogData.id = data.id;
    }
    if (data?.parentId !== undefined) {
      dialogData.parentId = data.parentId;
    }
    return this.dialog.open(componentOrTemplate as any, {
      data: dialogData,
      width: data?.width || '500px',
      disableClose: !!data?.disableClose,
      panelClass: 'custom-modal',
      autoFocus: false,
    });
  }

  showNotification(isSuccess: boolean, title: string, message: string) {
    return this.dialog.open(NotificationComponent, {
      data: { isSuccess, title, message },
      width: '400px',
      panelClass: 'custom-modal',
      autoFocus: false,
    });
  }

  // SweetAlert2: Alert simples
  showSweetNotification(
    title: string,
    text: string,
    icon: 'success' | 'error' | 'warning' | 'info' = 'info',
  ) {
    return Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: 'OK',
    });
  }

  showConfirmation(data: any) {
    return this.dialog.open(ConfirmationComponent, {
      data,
      width: '400px',
      panelClass: 'custom-modal',
      autoFocus: false,
    });
  }

  // SweetAlert2: Confirmação
  showSweetConfirmation(
    title: string,
    text: string,
    icon: 'warning' | 'question' = 'question',
    confirmButtonText = 'Sim',
    cancelButtonText = 'Cancelar',
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

  hideModal(dialogRef?: MatDialogRef<any>): void {
    if (dialogRef) {
      dialogRef.close();
    } else {
      this.dialog.closeAll();
    }
  }
}
