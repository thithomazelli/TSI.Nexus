import { FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NotificationService, Passenger, PassengerService, ResponseStatus } from '@nexus/core';
import { PassengerDetailsModalComponent } from './passenger-details-modal.component';

describe('PassengerDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };
  let passengerServiceMock: { add: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: unknown) {
    dialogRefMock = { close: vi.fn() };
    passengerServiceMock = { add: vi.fn(), update: vi.fn() };
    notificationServiceMock = { showMessage: vi.fn() };

    return new PassengerDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<PassengerDetailsModalComponent>,
      dialogData,
      new FormBuilder(),
      passengerServiceMock as unknown as PassengerService,
      notificationServiceMock as unknown as NotificationService,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent(null)).toBeTruthy();
  });

  it('should start in add mode with an empty form when no dialogData is provided', () => {
    // Act
    const component = createComponent(null);

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.tripId).toBe('');
    expect(component.form.value).toEqual({
      name: '',
      documentNumber: '',
      seat: '',
      phone: '',
    });
  });

  it('should start in edit mode pre-filled when existing passenger data is provided', () => {
    // Arrange
    const passenger: Passenger = {
      id: 'p1',
      name: 'Ana',
      documentNumber: '123',
      seat: '10',
      phone: '999',
      tripId: 't1',
    } as Passenger;

    // Act
    const component = createComponent({ data: passenger, tripId: 't1' });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.tripId).toBe('t1');
    expect(component.form.value).toEqual({
      name: 'Ana',
      documentNumber: '123',
      seat: '10',
      phone: '999',
    });
  });

  it('should close the dialog with null when close is called', () => {
    // Arrange
    const component = createComponent(null);

    // Act
    component.close();

    // Assert
    expect(dialogRefMock.close).toHaveBeenCalledWith(null);
  });

  it('should not submit and should mark the form as touched when the form is invalid', () => {
    // Arrange
    const component = createComponent({ tripId: 't1' });

    // Act
    component.submit();

    // Assert
    expect(component.form.touched).toBe(true);
    expect(passengerServiceMock.add).not.toHaveBeenCalled();
  });

  it('should add a new passenger and close the dialog when submit succeeds', () => {
    // Arrange
    const response = { status: ResponseStatus.Success, message: 'ok', data: {} as Passenger };
    const component = createComponent({ tripId: 't1' });
    passengerServiceMock.add.mockReturnValue(of(response));
    component.form.setValue({ name: 'Ana', documentNumber: '123', seat: '10', phone: '999' });

    // Act
    component.submit();

    // Assert
    expect(passengerServiceMock.add).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Ana', tripId: 't1' }),
    );
    expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(response.status, response.message);
    expect(dialogRefMock.close).toHaveBeenCalledWith(response);
    expect(component.saving).toBe(false);
  });

  it('should update an existing passenger including its id in the payload when editing', () => {
    // Arrange
    const passenger: Passenger = { id: 'p1', name: 'Ana', tripId: 't1' } as Passenger;
    const response = { status: ResponseStatus.Success, message: 'ok', data: passenger };
    const component = createComponent({ data: passenger, tripId: 't1' });
    passengerServiceMock.update.mockReturnValue(of(response));

    // Act
    component.submit();

    // Assert
    expect(passengerServiceMock.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p1', tripId: 't1' }),
    );
    expect(dialogRefMock.close).toHaveBeenCalledWith(response);
  });

  it('should not close the dialog when the backend reports a non-success status', () => {
    // Arrange
    const response = { status: ResponseStatus.Error, message: 'falhou', data: null };
    const component = createComponent({ tripId: 't1' });
    passengerServiceMock.add.mockReturnValue(of(response));
    component.form.setValue({ name: 'Ana', documentNumber: '', seat: '', phone: '' });

    // Act
    component.submit();

    // Assert
    expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(response.status, response.message);
    expect(dialogRefMock.close).not.toHaveBeenCalled();
    expect(component.saving).toBe(false);
  });

  it('should show a generic error notification and stop saving when the request errors out', () => {
    // Arrange
    const component = createComponent({ tripId: 't1' });
    passengerServiceMock.add.mockReturnValue(throwError(() => new Error('network error')));
    component.form.setValue({ name: 'Ana', documentNumber: '', seat: '', phone: '' });

    // Act
    component.submit();

    // Assert
    expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
      ResponseStatus.Error,
      'Erro ao salvar o passageiro.',
    );
    expect(component.saving).toBe(false);
  });

  it('should not submit again when a save is already in flight', () => {
    // Arrange
    const component = createComponent({ tripId: 't1' });
    component.form.setValue({ name: 'Ana', documentNumber: '', seat: '', phone: '' });
    component.saving = true;

    // Act
    component.submit();

    // Assert
    expect(passengerServiceMock.add).not.toHaveBeenCalled();
  });
});
