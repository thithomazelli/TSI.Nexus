import { FormGroup } from '@angular/forms';

export class FormBaseComponent {
  form!: FormGroup;
  submitted = false;
  errorMessages: string[] = [];
  formSubmitted = false;

  isInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return (
      (control && control.invalid && (control.touched || this.formSubmitted)) ||
      false
    );
  }

  isValid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return (
      !!control &&
      control.valid &&
      (control.touched || this.formSubmitted) &&
      control.value &&
      control.value.toString().trim() !== ''
    );
  }

  inputHasError(fieldName: string, validator: string): boolean {
    return (
      this.submitted && this.form.get(fieldName)?.hasError(validator) === true
    );
  }

  markAsTouched(fieldName: string): void {
    this.form.get(fieldName)?.markAsTouched();
  }
}
