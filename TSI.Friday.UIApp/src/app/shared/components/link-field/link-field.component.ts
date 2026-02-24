import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-link-field',
  standalone: false,
  templateUrl: './link-field.component.html',
  styleUrl: './link-field.component.scss',
})
export class LinkFieldComponent {
  @Input()
  placeHolder: string = '';

  @Input()
  text: string = '';

  @Input()
  routerLink: string[] = [];
}
