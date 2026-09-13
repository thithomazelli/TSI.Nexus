import { parsePassengerRows } from './passenger-import-parser';

describe('parsePassengerRows', () => {
  const tripId = 'trip-1';

  it('should parse comma-separated rows into Passenger objects when the input uses commas', () => {
    // Act
    const result = parsePassengerRows('Ana Silva,123.456.789-00,12,11999999999', tripId);

    // Assert
    expect(result).toEqual([
      {
        name: 'Ana Silva',
        documentNumber: '123.456.789-00',
        seat: '12',
        phone: '11999999999',
        tripId,
      },
    ]);
  });

  it('should parse tab-separated rows into Passenger objects when the input uses tabs', () => {
    // Act
    const result = parsePassengerRows('Ana Silva\t123.456.789-00\t12\t11999999999', tripId);

    // Assert
    expect(result).toEqual([
      {
        name: 'Ana Silva',
        documentNumber: '123.456.789-00',
        seat: '12',
        phone: '11999999999',
        tripId,
      },
    ]);
  });

  it('should trim whitespace from every column when the columns have surrounding spaces', () => {
    // Act
    const result = parsePassengerRows('  Ana Silva ,  123 , 12 , 999 ', tripId);

    // Assert
    expect(result[0]).toEqual({
      name: 'Ana Silva',
      documentNumber: '123',
      seat: '12',
      phone: '999',
      tripId,
    });
  });

  it('should parse multiple lines and skip blank lines when the input has several rows', () => {
    // Act
    const result = parsePassengerRows(
      'Ana Silva,123,12,999\n\nJoao Souza,456,13,888\n',
      tripId,
    );

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Ana Silva');
    expect(result[1].name).toBe('Joao Souza');
  });

  it('should default missing trailing columns to empty strings when the row has fewer columns', () => {
    // Act
    const result = parsePassengerRows('Ana Silva', tripId);

    // Assert
    expect(result[0]).toEqual({
      name: 'Ana Silva',
      documentNumber: '',
      seat: '',
      phone: '',
      tripId,
    });
  });

  it('should filter out rows with no name when a row is missing the name column', () => {
    // Act
    const result = parsePassengerRows(',123,12,999\nAna Silva,456,13,888', tripId);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Ana Silva');
  });

  it('should return an empty array when the input is empty', () => {
    // Act
    // Assert
    expect(parsePassengerRows('', tripId)).toEqual([]);
  });
});
