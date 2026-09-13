import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
  function createService(): CurrencyService {
    return new CurrencyService();
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  describe('formatCurrencyBRL', () => {
    it('should format a positive number as BRL currency when given a valid number', () => {
      // Arrange
      const service = createService();

      // Act
      const result = service.formatCurrencyBRL(1234.5);

      // Assert
      expect(result).toBe(
        (1234.5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      );
    });

    it('should return R$ 0,00 when the value is undefined', () => {
      // Arrange
      const service = createService();

      // Act
      const result = service.formatCurrencyBRL(undefined);

      // Assert
      expect(result).toBe('R$ 0,00');
    });

    it('should return R$ 0,00 when the value is null', () => {
      // Arrange
      const service = createService();

      // Act
      const result = service.formatCurrencyBRL(null);

      // Assert
      expect(result).toBe('R$ 0,00');
    });

    it('should return R$ 0,00 when the value is non-numeric', () => {
      // Arrange
      const service = createService();

      // Act
      const result = service.formatCurrencyBRL('not a number');

      // Assert
      expect(result).toBe('R$ 0,00');
    });
  });

  describe('parseCurrencyBRL', () => {
    it('should return the number unchanged when given a plain number', () => {
      // Arrange
      const service = createService();

      // Act
      const result = service.parseCurrencyBRL(42);

      // Assert
      expect(result).toBe(42);
    });

    it('should return 0 when the value is null, undefined or empty', () => {
      // Arrange
      const service = createService();

      // Act
      // Assert
      expect(service.parseCurrencyBRL(null)).toBe(0);
      expect(service.parseCurrencyBRL(undefined)).toBe(0);
      expect(service.parseCurrencyBRL('')).toBe(0);
    });

    it('should parse a pt-BR formatted string when it has a thousands dot and decimal comma', () => {
      // Arrange
      const service = createService();

      // Act
      const result = service.parseCurrencyBRL('1.234,56');

      // Assert
      expect(result).toBe(1234.56);
    });

    it('should parse the value correctly when there are multiple thousands separators', () => {
      // Arrange
      const service = createService();

      // Act
      const result = service.parseCurrencyBRL('1.234.567,89');

      // Assert
      expect(result).toBe(1234567.89);
    });

    it('should parse the value correctly when the string only has a decimal comma', () => {
      // Arrange
      const service = createService();

      // Act
      const result = service.parseCurrencyBRL('42,5');

      // Assert
      expect(result).toBe(42.5);
    });

    it('should parse the value as a whole number when the string has a thousands dot and no decimal comma', () => {
      // Arrange
      const service = createService();

      // Act
      const result = service.parseCurrencyBRL('1.500');

      // Assert
      expect(result).toBe(1500);
    });

    it('should strip the currency symbol and spaces when parsing the value', () => {
      // Arrange
      const service = createService();

      // Act
      const result = service.parseCurrencyBRL('R$ 100,00');

      // Assert
      expect(result).toBe(100);
    });

    it('should strip the currency symbol when the amount is thousands-separated', () => {
      // Arrange
      const service = createService();

      // Act
      const result = service.parseCurrencyBRL('R$ 1.234,56');

      // Assert
      expect(result).toBe(1234.56);
    });

    it('should return 0 when the string is unparseable', () => {
      // Arrange
      const service = createService();

      // Act
      const result = service.parseCurrencyBRL('abc');

      // Assert
      expect(result).toBe(0);
    });
  });
});
