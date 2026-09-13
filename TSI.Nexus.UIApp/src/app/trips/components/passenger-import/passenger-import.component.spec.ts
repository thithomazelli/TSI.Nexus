import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';
import { AttachmentService, Passenger, PassengerService, NotificationService, ResponseStatus } from '@nexus/core';
import { of, throwError } from 'rxjs';
import { PassengerImportComponent } from './passenger-import.component';

describe('PassengerImportComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };
  let passengerServiceMock: { addRange: ReturnType<typeof vi.fn> };
  let attachmentServiceMock: { add: ReturnType<typeof vi.fn> };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: any = { tripId: 't1' }): PassengerImportComponent {
    dialogRefMock = { close: vi.fn() };
    passengerServiceMock = { addRange: vi.fn() };
    attachmentServiceMock = { add: vi.fn() };
    notificationServiceMock = { showMessage: vi.fn() };

    return new PassengerImportComponent(
      dialogRefMock as unknown as MatDialogRef<PassengerImportComponent>,
      dialogData,
      passengerServiceMock as unknown as PassengerService,
      attachmentServiceMock as unknown as AttachmentService,
      notificationServiceMock as unknown as NotificationService,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  it('should read the tripId from the dialog data and fall back to an empty string when it is missing', () => {
    // Act
    // Assert
    expect(createComponent({ tripId: 't1' }).tripId).toBe('t1');
    expect(createComponent(null).tripId).toBe('');
    expect(createComponent({}).tripId).toBe('');
  });

  describe('close', () => {
    it('should close the dialog with null when close is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.close();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith(null);
    });
  });

  describe('onFileSelected', () => {
    it('should clear the selection and do nothing when there is no file', () => {
      // Arrange
      const component = createComponent();
      component.previewPassengers = [{ id: 'p1' } as Passenger];

      // Act
      component.onFileSelected({ target: { files: [] } } as unknown as Event);

      // Assert
      expect(component.selectedFile).toBeNull();
      expect(component.previewPassengers).toEqual([]);
    });

    it('should parse the selected file into preview passengers when a file is selected', async () => {
      // Arrange
      const component = createComponent();
      const file = new File(['Nome,Documento\nJoão,123'], 'passengers.csv', { type: 'text/csv' });

      // Act
      component.onFileSelected({ target: { files: [file] } } as unknown as Event);
      expect(component.selectedFile).toBe(file);

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(Array.isArray(component.previewPassengers)).toBe(true);
    });

    it('should treat a null reader result as an empty string when the file reader yields no result', async () => {
      // Arrange
      const component = createComponent();
      const file = new File([''], 'empty.csv', { type: 'text/csv' });
      const readAsTextSpy = vi
        .spyOn(FileReader.prototype, 'readAsText')
        .mockImplementation(function (this: FileReader) {
          Object.defineProperty(this, 'result', { value: null, configurable: true });
          this.onload?.(null as any);
        });

      // Act
      component.onFileSelected({ target: { files: [file] } } as unknown as Event);

      // Assert
      expect(component.previewPassengers).toEqual([]);
      readAsTextSpy.mockRestore();
    });
  });

  describe('confirmImport', () => {
    it('should do nothing when there is no selected file', () => {
      // Arrange
      const component = createComponent();
      component.previewPassengers = [{ id: 'p1' } as Passenger];

      // Act
      component.confirmImport();

      // Assert
      expect(passengerServiceMock.addRange).not.toHaveBeenCalled();
    });

    it('should do nothing when there are no preview passengers', () => {
      // Arrange
      const component = createComponent();
      component.selectedFile = new File(['x'], 'f.csv');
      component.previewPassengers = [];

      // Act
      component.confirmImport();

      // Assert
      expect(passengerServiceMock.addRange).not.toHaveBeenCalled();
    });

    it('should do nothing when an import is already in progress', () => {
      // Arrange
      const component = createComponent();
      component.selectedFile = new File(['x'], 'f.csv');
      component.previewPassengers = [{ id: 'p1' } as Passenger];
      component.importing = true;

      // Act
      component.confirmImport();

      // Assert
      expect(passengerServiceMock.addRange).not.toHaveBeenCalled();
    });

    it('should import the passengers and attachment and close the dialog when the import succeeds', () => {
      // Arrange
      const component = createComponent();
      component.selectedFile = new File(['x'], 'f.csv');
      component.previewPassengers = [{ id: 'p1' } as Passenger];
      passengerServiceMock.addRange.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Importado' }),
      );
      attachmentServiceMock.add.mockReturnValue(of({}));

      // Act
      component.confirmImport();

      // Assert
      expect(component.importing).toBe(false);
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'Importado',
      );
      expect(dialogRefMock.close).toHaveBeenCalledWith(true);
    });

    it('should not close the dialog when the import response is not a success', () => {
      // Arrange
      const component = createComponent();
      component.selectedFile = new File(['x'], 'f.csv');
      component.previewPassengers = [{ id: 'p1' } as Passenger];
      passengerServiceMock.addRange.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falha' }),
      );
      attachmentServiceMock.add.mockReturnValue(of({}));

      // Act
      component.confirmImport();

      // Assert
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should stop importing and show the extracted error message when the import fails', () => {
      // Arrange
      const component = createComponent();
      component.selectedFile = new File(['x'], 'f.csv');
      component.previewPassengers = [{ id: 'p1' } as Passenger];
      passengerServiceMock.addRange.mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: { message: 'Deu erro' }, status: 400 })),
      );
      attachmentServiceMock.add.mockReturnValue(of({}));

      // Act
      component.confirmImport();

      // Assert
      expect(component.importing).toBe(false);
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Error', 'Deu erro');
    });
  });

  describe('extractErrorMessage (private, via confirmImport error path)', () => {
    function triggerError(err: HttpErrorResponse): void {
      const component = createComponent();
      component.selectedFile = new File(['x'], 'f.csv');
      component.previewPassengers = [{ id: 'p1' } as Passenger];
      passengerServiceMock.addRange.mockReturnValue(throwError(() => err));
      attachmentServiceMock.add.mockReturnValue(of({}));

      component.confirmImport();
    }

    it('should join validation errors when the "errors" field is present', () => {
      // Act
      triggerError(new HttpErrorResponse({ error: { errors: ['A', 'B'] }, status: 400 }));

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Error', 'A B');
    });

    it('should join validation errors when the "Errors" field is present', () => {
      // Act
      triggerError(new HttpErrorResponse({ error: { Errors: ['C'] }, status: 400 }));

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Error', 'C');
    });

    it('should use the raw string body when it is a non-empty string', () => {
      // Act
      triggerError(new HttpErrorResponse({ error: 'raw error text', status: 400 }));

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Error', 'raw error text');
    });

    it('should ignore a blank string body and fall through to the generic message', () => {
      // Act
      triggerError(new HttpErrorResponse({ error: '   ', status: 500 }));

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'Error',
        'Erro ao importar a lista de passageiros (HTTP 500).',
      );
    });

    it('should use the body message field when it is present', () => {
      // Act
      triggerError(new HttpErrorResponse({ error: { message: 'Falhou' }, status: 400 }));

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Error', 'Falhou');
    });

    it('should fall back to a generic message with the HTTP status when nothing else matches', () => {
      // Act
      triggerError(new HttpErrorResponse({ error: {}, status: 500 }));

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'Error',
        'Erro ao importar a lista de passageiros (HTTP 500).',
      );
    });

    it('should fall back to "?" when there is no HTTP status at all', () => {
      // Act
      triggerError({ error: {} } as HttpErrorResponse);

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'Error',
        'Erro ao importar a lista de passageiros (HTTP ?).',
      );
    });
  });
});
