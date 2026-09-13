import {
  formatCPF,
  formatCNPJ,
  formatDocument,
  formatCurrencyBRL,
  formatDateBR,
  formatDateTimeBR,
} from './format-utils';

describe('formatCPF', () => {
  it('should format an unformatted CPF when the input has 11 digits', () => {
    // Act
    // Assert
    expect(formatCPF('12345678901')).toBe('123.456.789-01');
  });

  it('should strip existing punctuation and reformat the CPF when the input already has punctuation', () => {
    // Act
    // Assert
    expect(formatCPF('123.456.789-01')).toBe('123.456.789-01');
  });

  it('should return the cleaned digits unformatted when the length is not 11', () => {
    // Act
    // Assert
    expect(formatCPF('123')).toBe('123');
  });

  it('should return an empty string when the input is null, undefined, or empty', () => {
    // Act
    // Assert
    expect(formatCPF(null)).toBe('');
    expect(formatCPF(undefined)).toBe('');
    expect(formatCPF('')).toBe('');
  });
});

describe('formatCNPJ', () => {
  it('should format an unformatted CNPJ when the input has 14 digits', () => {
    // Act
    // Assert
    expect(formatCNPJ('12345678000199')).toBe('12.345.678/0001-99');
  });

  it('should strip existing punctuation and reformat the CNPJ when the input already has punctuation', () => {
    // Act
    // Assert
    expect(formatCNPJ('12.345.678/0001-99')).toBe('12.345.678/0001-99');
  });

  it('should return the cleaned digits unformatted when the length is not 14', () => {
    // Act
    // Assert
    expect(formatCNPJ('123')).toBe('123');
  });

  it('should return an empty string when the input is null, undefined, or empty', () => {
    // Act
    // Assert
    expect(formatCNPJ(null)).toBe('');
    expect(formatCNPJ(undefined)).toBe('');
    expect(formatCNPJ('')).toBe('');
  });
});

describe('formatDocument', () => {
  it('should format as CPF when the clean length is 11', () => {
    // Act
    // Assert
    expect(formatDocument('12345678901')).toBe('123.456.789-01');
  });

  it('should format as CNPJ when the clean length is 14', () => {
    // Act
    // Assert
    expect(formatDocument('12345678000199')).toBe('12.345.678/0001-99');
  });

  it('should return the original value when the length matches neither CPF nor CNPJ', () => {
    // Act
    // Assert
    expect(formatDocument('123')).toBe('123');
  });

  it('should return an empty string when the input is null, undefined, or empty', () => {
    // Act
    // Assert
    expect(formatDocument(null)).toBe('');
    expect(formatDocument(undefined)).toBe('');
    expect(formatDocument('')).toBe('');
  });
});

describe('formatCurrencyBRL', () => {
  it('should format a numeric value as BRL currency when given a number', () => {
    // Act
    // Assert
    expect(formatCurrencyBRL(1234.5)).toBe(
      (1234.5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    );
  });

  it('should format a numeric string value as BRL currency when given a string number', () => {
    // Act
    // Assert
    expect(formatCurrencyBRL('1234.5')).toBe(
      (1234.5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    );
  });

  it('should return an empty string when the value is null, undefined, or empty', () => {
    // Act
    // Assert
    expect(formatCurrencyBRL(null)).toBe('');
    expect(formatCurrencyBRL(undefined)).toBe('');
    expect(formatCurrencyBRL('')).toBe('');
  });

  it('should return the original value stringified when the value is not numeric', () => {
    // Act
    // Assert
    expect(formatCurrencyBRL('abc')).toBe('abc');
  });
});

describe('formatDateBR', () => {
  it('should format a Date object as dd/MM/yyyy when given a valid date', () => {
    // Act
    // Assert
    expect(formatDateBR(new Date(2024, 0, 5))).toBe('05/01/2024');
  });

  it('should format an ISO date string as dd/MM/yyyy when given a valid date string', () => {
    // Act
    // Assert
    expect(formatDateBR('2024-03-15T00:00:00')).toBe('15/03/2024');
  });

  it('should return an empty string when the value is null or undefined', () => {
    // Act
    // Assert
    expect(formatDateBR(null)).toBe('');
    expect(formatDateBR(undefined)).toBe('');
  });

  it('should return an empty string when the date is invalid', () => {
    // Act
    // Assert
    expect(formatDateBR('not-a-date')).toBe('');
  });
});

describe('formatDateTimeBR', () => {
  it('should format a Date object as dd/MM/yyyy HH:mm when given a valid date', () => {
    // Arrange
    const date = new Date(2024, 0, 5, 8, 7);

    // Act
    // Assert
    expect(formatDateTimeBR(date)).toBe('05/01/2024 08:07');
  });

  it('should return an empty string when the value is null or undefined', () => {
    // Act
    // Assert
    expect(formatDateTimeBR(null)).toBe('');
    expect(formatDateTimeBR(undefined)).toBe('');
  });

  it('should return an empty string when the date is invalid', () => {
    // Act
    // Assert
    expect(formatDateTimeBR('not-a-date')).toBe('');
  });
});
