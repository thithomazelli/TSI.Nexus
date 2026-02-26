import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ModalService } from '@friday/core';

@Component({
  selector: 'app-link-field',
  templateUrl: './link-field.component.html',
  styleUrl: './link-field.component.scss',
  standalone: false,
})
export class LinkFieldComponent {
  @Input()
  placeHolder: string = '';

  @Input()
  text: string = '';

  @Input()
  routerLink: string[] = [];

  constructor(
    private router: Router,
    private modalService: ModalService,
  ) {}

  onClick() {
    this.router.navigate(this.routerLink);
    this.modalService.hideModal();
  }
}
