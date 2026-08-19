import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

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
}
