import { Address } from './address.model';

describe('Address', () => {
  it('should copy every field when constructed from an initializer', () => {
    // Arrange
    const initializer = {
      id: '1',
      name: 'Matriz',
      street: 'Rua A',
      number: 100,
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01000-000',
      country: 'Brasil',
      comments: 'Fundos',
      type: 'Comercial',
      businessPartnerId: 'bp1',
      isDefault: true,
    };

    // Act
    const address = new Address(initializer);

    // Assert
    expect(address).toMatchObject({
      id: '1',
      name: 'Matriz',
      street: 'Rua A',
      number: 100,
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01000-000',
      country: 'Brasil',
      comments: 'Fundos',
      type: 'Comercial',
      businessPartnerId: 'bp1',
      isDefault: true,
    });
  });

  it('should leave every field undefined when constructed with no initializer', () => {
    // Act
    const address = new Address();

    // Assert
    expect(address.street).toBeUndefined();
    expect(address.number).toBeUndefined();
    expect(address.city).toBeUndefined();
  });

  describe('address getter', () => {
    it('should join every field when all are present', () => {
      // Arrange
      const address = new Address({
        street: 'Rua A',
        number: 100,
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000',
        country: 'Brasil',
      });

      // Act
      // Assert
      expect(address.address).toBe('Rua A, 100 - São Paulo, SP, 01000-000, Brasil');
    });

    it('should fall back to an empty string for each missing field', () => {
      // Arrange
      const address = new Address();

      // Act
      // Assert
      expect(address.address).toBe(',  - , , , ');
    });
  });
});
