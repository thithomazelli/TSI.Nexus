import { CurrencyService } from '@nexus/core';
import { CurrencyFieldComponent } from './currency-field.component';

describe('CurrencyFieldComponent', () => {
  let currencyServiceMock: {
    formatCurrencyBRL: ReturnType<typeof vi.fn>;
    parseCurrencyBRL: ReturnType<typeof vi.fn>;
  };
  let component: CurrencyFieldComponent;

  beforeEach(() => {
    currencyServiceMock = {
      formatCurrencyBRL: vi.fn((value: number) => `R$ ${value.toFixed(2).replace('.', ',')}`),
      parseCurrencyBRL: vi.fn((value: string) => Number(value.replace(/\D/g, '')) / 100),
    };
    component = new CurrencyFieldComponent(currencyServiceMock as unknown as CurrencyService);
  });

  it('should create the component when instantiated', () => {
    // Act / Assert
    expect(component).toBeTruthy();
  });

  it('should assign each instance a unique fieldId when created', () => {
    // Act
    const other = new CurrencyFieldComponent(currencyServiceMock as unknown as CurrencyService);

    // Assert
    expect(component.fieldId).not.toBe(other.fieldId);
  });

  it('should format null/undefined/empty values as zero when writeValue is called', () => {
    // Act / Assert
    component.writeValue(null);
    expect(currencyServiceMock.formatCurrencyBRL).toHaveBeenCalledWith(0);

    component.writeValue(undefined);
    expect(currencyServiceMock.formatCurrencyBRL).toHaveBeenCalledWith(0);

    component.writeValue('');
    expect(currencyServiceMock.formatCurrencyBRL).toHaveBeenCalledWith(0);
  });

  it('should format a non-numeric value as zero when writeValue is called', () => {
    // Act
    component.writeValue('abc');

    // Assert
    expect(currencyServiceMock.formatCurrencyBRL).toHaveBeenCalledWith(0);
  });

  it('should format a numeric value and store the display string when writeValue is called', () => {
    // Act
    component.writeValue(1234.5);

    // Assert
    expect(currencyServiceMock.formatCurrencyBRL).toHaveBeenCalledWith(1234.5);
    expect(component.displayValue).toBe('R$ 1234,50');
  });

  it('should accept a numeric string when writeValue is called', () => {
    // Act
    component.writeValue('99.9');

    // Assert
    expect(currencyServiceMock.formatCurrencyBRL).toHaveBeenCalledWith(99.9);
  });

  it('should register the onChange/onTouched callbacks and invoke them when onBlur runs', () => {
    // Arrange
    const onChange = vi.fn();
    const onTouched = vi.fn();
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);

    // Act
    component.onBlur();

    // Assert
    expect(onChange).toHaveBeenCalled();
    expect(onTouched).toHaveBeenCalled();
  });

  it('should do nothing when onBlur runs before onChange/onTouched are registered', () => {
    // Arrange
    component.displayValue = '1.234,50';

    // Act / Assert
    expect(() => component.onBlur()).not.toThrow();
  });

  it('should set isDisabled when setDisabledState is called', () => {
    // Act / Assert
    component.setDisabledState(true);
    expect(component.isDisabled).toBe(true);

    component.setDisabledState(false);
    expect(component.isDisabled).toBe(false);
  });

  it('should update displayValue as the user types without reformatting', () => {
    // Act
    component.onInputChange('12,3');

    // Assert
    expect(component.displayValue).toBe('12,3');
    expect(currencyServiceMock.formatCurrencyBRL).not.toHaveBeenCalled();
  });

  it('should reformat the display value and propagate the parsed number when onBlur is called', () => {
    // Arrange
    const onChange = vi.fn();
    component.registerOnChange(onChange);
    component.displayValue = '1.234,50';

    // Act
    component.onBlur();

    // Assert
    expect(currencyServiceMock.parseCurrencyBRL).toHaveBeenCalledWith('1.234,50');
    expect(onChange).toHaveBeenCalledWith(1234.5);
    expect(component.displayValue).toBe('R$ 1234,50');
  });
});
