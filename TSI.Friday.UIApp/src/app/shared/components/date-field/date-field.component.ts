import {
  Component,
  Input,
  forwardRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ModalService } from '@friday/core';

@Component({
  selector: 'app-date-field',
  templateUrl: 'date-field.component.html',
  styleUrls: ['date-field.component.scss'],
  standalone: false,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateFieldComponent),
      multi: true,
    },
  ],
})
export class DateFieldComponent implements ControlValueAccessor {
  constructor(private modalService: ModalService) {}
  @ViewChild('dateInput')
  dateInput!: ElementRef<HTMLInputElement>;

  @Input()
  formControlName: string = '';

  @Input()
  label: string = 'Data';

  @Input()
  placeholder: string = 'DD/MM/AAAA';

  value: string = '';

  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(val: any): void {
    this.value = val;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // Limpa o campo de data visual e logicamente
  clear() {
    this.value = '';
    this.onChange(this.value);
    // Limpa o input visualmente
    if (this.dateInput && this.dateInput.nativeElement) {
      this.dateInput.nativeElement.value = '';
    }
  }

  onDateChange(event: any) {
    this.value = event.value;
    this.onChange(this.value);
  }

  onBlur() {
    // Se a data digitada tiver 8 números, validar se é uma data válida
    let inputValue = '';
    if (this.dateInput && this.dateInput.nativeElement) {
      inputValue = this.dateInput.nativeElement.value;
    } else {
      inputValue = this.value || '';
    }
    const digits = inputValue.replace(/\D/g, '');
    if (digits.length === 8) {
      const d = Number(digits.slice(0, 2));
      const m = Number(digits.slice(2, 4));
      const y = Number(digits.slice(4));
      const dt = new Date(y, m - 1, d);
      // Data inválida: mês fora do range, dia fora do mês, ou data inválida do JS
      if (
        isNaN(dt.getTime()) ||
        dt.getDate() !== d ||
        dt.getMonth() !== m - 1 ||
        dt.getFullYear() !== y
      ) {
        this.clear();
        this.modalService.showNotification(
          false,
          'Data inválida',
          'A data informada é inválida.',
        );
      }
    }
  }

  // Formata automaticamente DD/MM/YYYY e limita a 10 caracteres
  onDateInput(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    let formatted = '';
    if (value.length === 2) {
      formatted = value + '/';
    } else if (value.length <= 2) {
      formatted = value;
    } else if (value.length === 4) {
      formatted = value.substring(0, 2) + '/' + value.substring(2) + '/';
    } else if (value.length <= 4) {
      formatted = value.substring(0, 2) + '/' + value.substring(2);
    } else {
      formatted =
        value.substring(0, 2) +
        '/' +
        value.substring(2, 4) +
        '/' +
        value.substring(4);
    }
    event.target.value = formatted;
  }

  // Bloqueia letras e limita a 10 caracteres totais (incluindo barras)
  onDateKeyDown(event: KeyboardEvent) {
    const allowed = [
      'Backspace',
      'Tab',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
      'Home',
      'End',
    ];
    const input = event.target as HTMLInputElement;
    // Permite teclas de controle
    if (allowed.includes(event.key)) {
      return;
    }
    // Bloqueia a digitação manual da barra
    if (event.key === '/') {
      event.preventDefault();
      return;
    }
    // Permite números se ainda não atingiu 10 caracteres totais
    if (event.key >= '0' && event.key <= '9') {
      if (
        input.value.length >= 10 &&
        input.selectionStart === input.selectionEnd
      ) {
        event.preventDefault();
      }
      return;
    }
    // Bloqueia qualquer outro caractere
    event.preventDefault();
  }
}
