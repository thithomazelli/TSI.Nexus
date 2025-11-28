import { Component } from '@angular/core';
import { ModalService } from '@friday/core';

@Component({
  selector: 'app-confirmation',
  standalone: false,
  templateUrl: './confirmation.component.html',
  styleUrl: './confirmation.component.scss',
})
export class ConfirmationComponent<T> {
  title: string = 'Confirmação';
  message: string = 'Tem certeza que deseja excluir este item?';
  data: T | undefined;
  confirmDelete!: () => void;

  constructor(public modalService: ModalService) {}
}
