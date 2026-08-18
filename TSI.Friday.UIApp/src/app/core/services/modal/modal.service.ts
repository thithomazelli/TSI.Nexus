import { Injectable, TemplateRef, Type, Inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { NotificationComponent } from '../../../shared/components/modals/notification/notification.component';
import { ConfirmationComponent } from '../../../shared/components/modals/confirmation/confirmation.component';
import { TranslationService } from '../translation/translation.service';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  // Removido suporte a ngx-bootstrap/modal
  constructor(
    private dialog: MatDialog,
    private translationService: TranslationService,
  ) {}

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
      width: data?.width || '600px',
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
  showSweetNotification(title: string, text: string, icon: string) {
    const iconNormalized = this.mapStatusToIcon(icon);

    return Swal.fire({
      title,
      text,
      icon: iconNormalized,
      confirmButtonText: 'OK',
      // 'OK' is understood across pt-BR/en/es and is left untranslated intentionally.
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
    confirmButtonText = this.translationService.instant('COMMON.YES'),
    cancelButtonText = this.translationService.instant('COMMON.CANCEL'),
  ) {
    return Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      confirmButtonColor: '#198754', // Bootstrap success color
      cancelButtonText,
      cancelButtonColor: '#6c757d', // Bootstrap secondary color
      reverseButtons: true,
      showCloseButton: true,
      customClass: {
        confirmButton: 'swal-btn',
        cancelButton: 'swal-btn',
      },
    });
  }

  hideModal(dialogRef?: MatDialogRef<any>): void {
    if (dialogRef) {
      dialogRef.close();
    } else {
      this.dialog.closeAll();
    }
  }

  private mapStatusToIcon(
    status: string,
  ): 'success' | 'error' | 'warning' | 'info' {
    const normalized = status.toLowerCase();

    if (['success', 'ok'].includes(normalized)) {
      return 'success';
    }

    if (['error', 'fail', 'failed'].includes(normalized)) {
      return 'error';
    }

    if (['warning', 'warn', 'alert'].includes(normalized)) {
      return 'warning';
    }

    return 'info';
  }
}
