import { Component, ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, NgControl, ReactiveFormsModule } from '@angular/forms';
import { CurrencyFormatDirective } from './currency-format.directive';

describe('CurrencyFormatDirective', () => {
  let input: HTMLInputElement;
  let controlMock: { control: { value: unknown; setValue: ReturnType<typeof vi.fn> } };

  function createDirective(initialValue: unknown): CurrencyFormatDirective {
    input = document.createElement('input');
    controlMock = { control: { value: initialValue, setValue: vi.fn() } };
    return new CurrencyFormatDirective(
      new ElementRef(input),
      controlMock as unknown as NgControl,
    );
  }

  it('should create the directive when instantiated', () => {
    // Act
    const directive = createDirective(null);

    // Assert
    expect(directive).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should format the initial control value into the input when there is a value', () => {
      // Arrange
      const directive = createDirective(1234.5);

      // Act
      directive.ngOnInit();

      // Assert
      expect(input.value).toBe('1.234,50');
    });

    it('should leave the input empty when there is no initial value', () => {
      // Arrange
      const directive = createDirective(null);

      // Act
      directive.ngOnInit();

      // Assert
      expect(input.value).toBe('');
    });
  });

  describe('onFocus', () => {
    it('should convert the formatted value to a plain comma-decimal string when the input is focused', () => {
      // Arrange
      const directive = createDirective(null);
      input.value = '1.234,50';

      // Act
      directive.onFocus();

      // Assert
      expect(input.value).toBe('1234,5');
    });

    it('should clear the input when there is nothing to convert', () => {
      // Arrange
      const directive = createDirective(null);
      input.value = '';

      // Act
      directive.onFocus();

      // Assert
      expect(input.value).toBe('');
    });
  });

  describe('onInput', () => {
    it('should strip characters other than digits, dot, and comma while typing', () => {
      // Arrange
      const directive = createDirective(null);
      input.value = 'R$ 1a2b,3c';

      // Act
      directive.onInput();

      // Assert
      expect(input.value).toBe('12,3');
    });
  });

  describe('onBlur', () => {
    it('should format a typed value and push the numeric value to the form control when the input is blurred', () => {
      // Arrange
      const directive = createDirective(null);
      input.value = '1234,5';

      // Act
      directive.onBlur();

      // Assert
      expect(controlMock.control.setValue).toHaveBeenCalledWith(1234.5);
      expect(input.value).toBe('1.234,50');
    });

    it('should parse a value with a thousands separator correctly when the input is blurred', () => {
      // Arrange
      const directive = createDirective(null);
      input.value = '1.234,56';

      // Act
      directive.onBlur();

      // Assert
      expect(controlMock.control.setValue).toHaveBeenCalledWith(1234.56);
    });

    it('should parse a plain value with no thousands or decimal separator when the input is blurred', () => {
      // Arrange
      const directive = createDirective(null);
      input.value = '1234';

      // Act
      directive.onBlur();

      // Assert
      expect(controlMock.control.setValue).toHaveBeenCalledWith(1234);
    });

    it('should clear the control when the cleaned value has no digits left to parse', () => {
      // Arrange
      const directive = createDirective(null);
      input.value = '.';

      // Act
      directive.onBlur();

      // Assert
      expect(controlMock.control.setValue).toHaveBeenCalledWith(null);
      expect(input.value).toBe('');
    });

    it('should clear the control and input when the typed value is not a number', () => {
      // Arrange
      const directive = createDirective(null);
      input.value = '';

      // Act
      directive.onBlur();

      // Assert
      expect(controlMock.control.setValue).toHaveBeenCalledWith(null);
      expect(input.value).toBe('');
    });
  });

  // The @HostListener('focus') decorator makes Angular's Ivy compiler generate a dispatch
  // wrapper (CurrencyFormatDirective_focus_HostBindingHandler) around onFocus() - that wrapper
  // only runs from a real DOM event through change detection, never from calling onFocus()
  // directly as the tests above do, so it needs one real TestBed render to be exercised.
  describe('real DOM focus event (Ivy host-binding dispatch)', () => {
    @Component({
      standalone: true,
      imports: [ReactiveFormsModule, CurrencyFormatDirective],
      template: `<input appCurrencyFormat [formControl]="control" />`,
    })
    class HostComponent {
      control = new FormControl(1234.5);
    }

    it('should run onFocus through the compiled host-listener binding when a real focus event fires', () => {
      // Arrange
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      const hostInput: HTMLInputElement = fixture.nativeElement.querySelector('input');

      // Act
      hostInput.dispatchEvent(new Event('focus'));

      // Assert
      expect(hostInput.value).toBe('1234,5');
    });
  });
});
