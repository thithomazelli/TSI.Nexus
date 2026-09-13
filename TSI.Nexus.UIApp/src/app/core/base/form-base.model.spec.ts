import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FormBaseComponent } from './form-base.model';

describe('FormBaseComponent', () => {
  function createComponent(): FormBaseComponent {
    const component = new FormBaseComponent();
    component.form = new FormGroup({
      name: new FormControl('', [Validators.required]),
    });
    return component;
  }

  describe('isInvalid', () => {
    it('should return false when the field does not exist', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.isInvalid('missing')).toBe(false);
    });

    it('should return false when an invalid field has not been touched or submitted', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.isInvalid('name')).toBe(false);
    });

    it('should return true when an invalid field has been touched', () => {
      // Arrange
      const component = createComponent();
      component.form.get('name')?.markAsTouched();

      // Act
      // Assert
      expect(component.isInvalid('name')).toBe(true);
    });

    it('should return true when an invalid field is checked after the form has been submitted', () => {
      // Arrange
      const component = createComponent();
      component.submitted = true;

      // Act
      // Assert
      expect(component.isInvalid('name')).toBe(true);
    });

    it('should return false when the field is valid and touched', () => {
      // Arrange
      const component = createComponent();
      component.form.get('name')?.setValue('Ana');
      component.form.get('name')?.markAsTouched();

      // Act
      // Assert
      expect(component.isInvalid('name')).toBe(false);
    });
  });

  describe('isValid', () => {
    it('should return false when the field does not exist', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.isValid('missing')).toBe(false);
    });

    it('should return false when the field is invalid', () => {
      // Arrange
      const component = createComponent();
      component.form.get('name')?.markAsTouched();

      // Act
      // Assert
      expect(component.isValid('name')).toBe(false);
    });

    it('should return false when a valid field has not been touched or submitted', () => {
      // Arrange
      const component = createComponent();
      component.form.get('name')?.setValue('Ana');

      // Act
      // Assert
      expect(component.isValid('name')).toBe(false);
    });

    it('should return false when a valid, touched field has only whitespace as its value', () => {
      // Arrange
      const component = createComponent();
      component.form.get('name')?.setValue('   ');
      component.form.get('name')?.markAsTouched();

      // Act
      // Assert
      expect(component.isValid('name')).toBe(false);
    });

    it('should return true when a valid, touched field has a real value', () => {
      // Arrange
      const component = createComponent();
      component.form.get('name')?.setValue('Ana');
      component.form.get('name')?.markAsTouched();

      // Act
      // Assert
      expect(component.isValid('name')).toBe(true);
    });

    it('should return true when a valid field is checked after the form has been submitted', () => {
      // Arrange
      const component = createComponent();
      component.form.get('name')?.setValue('Ana');
      component.submitted = true;

      // Act
      // Assert
      expect(component.isValid('name')).toBe(true);
    });
  });

  describe('inputHasError', () => {
    it('should return false when the form has not been submitted, even with a matching error', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.inputHasError('name', 'required')).toBe(false);
    });

    it('should return true when the field has the given error after being submitted', () => {
      // Arrange
      const component = createComponent();
      component.submitted = true;

      // Act
      // Assert
      expect(component.inputHasError('name', 'required')).toBe(true);
    });

    it('should return false when the field does not have the given error after being submitted', () => {
      // Arrange
      const component = createComponent();
      component.form.get('name')?.setValue('Ana');
      component.submitted = true;

      // Act
      // Assert
      expect(component.inputHasError('name', 'required')).toBe(false);
    });

    it('should return false when the field does not exist', () => {
      // Arrange
      const component = createComponent();
      component.submitted = true;

      // Act
      // Assert
      expect(component.inputHasError('missing', 'required')).toBe(false);
    });
  });

  describe('markAsTouched', () => {
    it('should mark the given field as touched when called', () => {
      // Arrange
      const component = createComponent();
      expect(component.form.get('name')?.touched).toBe(false);

      // Act
      component.markAsTouched('name');

      // Assert
      expect(component.form.get('name')?.touched).toBe(true);
    });

    it('should do nothing when the field does not exist', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.markAsTouched('missing')).not.toThrow();
    });
  });
});
