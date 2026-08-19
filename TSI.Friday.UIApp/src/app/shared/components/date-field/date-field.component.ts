import { Component, Input, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';

let dateFieldIdCounter = 0;

const ALLOWED_CONTROL_KEYS = [
  'Backspace',
  'Delete',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Tab',
  'Home',
  'End',
  'Enter',
  'Escape',
];

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
  @Input()
  formControlName: string = '';

  @Input()
  label: string = 'Data';

  @Input()
  placeholder: string = 'DD/MM/AAAA';

  @Input()
  isDisabled: boolean = false;

  @ViewChild('picker')
  picker?: DatePicker;

  readonly fieldId = `date-field-${++dateFieldIdCounter}`;

  value: Date | null = null;

  onChange: (value: Date | null) => void = () => {};
  onTouched = () => {};

  // Accepts whatever the form is patched with - a real Date (calendar-picked, or already a Date
  // coming back from the API) or an ISO/parsable date string - and always ends up with a Date
  // object or null, which p-datepicker (and the DD/MM/AAAA display it renders) both expect.
  writeValue(val: unknown): void {
    if (!val) {
      this.value = null;
      return;
    }
    this.value = val instanceof Date ? val : new Date(val as string);
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onModelChange(value: Date | null): void {
    this.value = value;
    this.onChange(value);
  }

  toggleCalendar(): void {
    this.picker?.toggle();
  }

  // Restricts typing to digits, "/" and the usual editing/navigation keys - nothing else reaches
  // the input, so the field can never end up holding letters or stray punctuation.
  onInputKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (ALLOWED_CONTROL_KEYS.includes(event.key)) {
      return;
    }
    if (!/^[0-9/]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  // Reformats whatever digits are present into DD/MM/YYYY as the user types (or deletes), auto-
  // inserting the "/" separators, then - once all 8 digits are in - parses a real Date and pushes
  // it through the CVA so the form control updates without waiting for blur.
  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 8);

    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    input.value = formatted;
    input.setSelectionRange(formatted.length, formatted.length);

    if (digits.length === 8) {
      const day = parseInt(digits.slice(0, 2), 10);
      const month = parseInt(digits.slice(2, 4), 10);
      const year = parseInt(digits.slice(4, 8), 10);
      const parsed = new Date(year, month - 1, day);
      const isValid =
        parsed.getFullYear() === year &&
        parsed.getMonth() === month - 1 &&
        parsed.getDate() === day;
      if (isValid) {
        this.onModelChange(parsed);
      }
    }
  }
}
