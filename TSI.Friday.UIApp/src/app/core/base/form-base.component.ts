import { FormGroup } from '@angular/forms';

export class FormBaseComponent {
  submitted = false;
  errorMessages: string[] = [];

  canDisplayInputErrors(fieldName: string, form: FormGroup): boolean {
    return this.submitted && form.get(fieldName)?.errors != null;
  }

  inputHasError(fieldName: string, validator: string, form: FormGroup) {
    return this.submitted && form.get(fieldName)?.hasError(validator);
  }
}
