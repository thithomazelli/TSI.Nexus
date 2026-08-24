import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly _notificationMap: {
    [key: string]: (msg: string, title?: string) => void;
  } = {
    Success: this.success.bind(this),
    Error: this.error.bind(this),
    Info: this.info.bind(this),
    Warning: this.warning.bind(this),
  };

  showMessage(type: string, message: string, title?: string) {
    // Callers pass this in every casing (ResponseStatus values like 'Success'/'Error', but also
    // plain string literals like 'error' from local catch handlers) - _notificationMap's keys
    // are capitalized, so an exact-match lookup crashed with "... is not a function" instead of
    // showing the message whenever a caller used a different casing, which is exactly the case
    // that matters most (an error toast failing to appear when a save fails).
    const key = Object.keys(this._notificationMap).find(
      (k) => k.toLowerCase() === type?.toLowerCase(),
    );
    const handler = key ? this._notificationMap[key] : this.error;
    handler.call(this, message, title);
  }

  private success(message: string, title?: string) {
    Swal.fire({
      icon: 'success',
      title: '',
      text: message,
      toast: true,
      position: 'top-end',
      timer: 3000,
      showCloseButton: true,
      showConfirmButton: false,
      timerProgressBar: true,
      background: '#198754', // verde bootstrap
      color: '#fff',
      customClass: {
        title: 'swal2-title-custom',
        popup: 'swal2-popup-small',
        htmlContainer: 'swal2-html-custom',
        closeButton: 'swal2-close-custom',
      },
    });
  }

  private error(message: string, title?: string) {
    Swal.fire({
      icon: 'error',
      title: '',
      text: message,
      toast: true,
      position: 'top-end',
      timer: 4000,
      showCloseButton: true,
      showConfirmButton: false,
      timerProgressBar: true,
      background: '#dc3545', // vermelho bootstrap
      color: '#fff',
      customClass: {
        title: 'swal2-title-custom',
        popup: 'swal2-popup-small',
        htmlContainer: 'swal2-html-custom',
        closeButton: 'swal2-close-custom',
      },
    });
  }

  private info(message: string, title?: string) {
    Swal.fire({
      icon: 'info',
      title: '',
      text: message,
      toast: true,
      position: 'top-end',
      timer: 3000,
      showConfirmButton: false,
      timerProgressBar: true,
      background: '#0d6efd', // azul bootstrap
      color: '#fff',
      customClass: {
        title: 'swal2-title-custom',
        popup: 'swal2-popup-small',
        htmlContainer: 'swal2-html-custom',
      },
    });
  }

  private warning(message: string, title?: string) {
    Swal.fire({
      icon: 'warning',
      title: '',
      text: message,
      toast: true,
      position: 'top-end',
      timer: 3500,
      showConfirmButton: false,
      timerProgressBar: true,
      background: '#ffc107', // amarelo bootstrap
      color: '#212529', // texto escuro para contraste
      customClass: {
        title: 'swal2-title-custom',
        popup: 'swal2-popup-small',
        htmlContainer: 'swal2-html-custom',
      },
    });
  }
}
