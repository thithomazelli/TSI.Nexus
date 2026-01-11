import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly notificationMap: {
    [key: string]: (msg: string, title?: string) => void;
  } = {
    Success: this.success.bind(this),
    Error: this.error.bind(this),
    Info: this.info.bind(this),
    Warning: this.warning.bind(this),
  };

  showMessage(type: string, message: string, title?: string) {
    this.notificationMap[type](message, title);
  }

  private success(message: string, title?: string) {
    Swal.fire({
      icon: 'success',
      title: '',
      text: message,
      toast: true,
      position: 'top-end',
      timer: 3000,
      showConfirmButton: false,
      timerProgressBar: true,
      background: '#198754', // verde bootstrap
      color: '#fff',
      customClass: {
        title: 'swal2-title-custom',
        popup: 'swal2-popup-small',
        htmlContainer: 'swal2-html-custom',
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
      showConfirmButton: false,
      timerProgressBar: true,
      background: '#dc3545', // vermelho bootstrap
      color: '#fff',
      customClass: {
        title: 'swal2-title-custom',
        popup: 'swal2-popup-small',
        htmlContainer: 'swal2-html-custom',
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
