import { TestBed } from '@angular/core/testing';
import Swal from 'sweetalert2';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let fireSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fireSpy = vi.spyOn(Swal, 'fire').mockReturnValue(undefined as unknown as ReturnType<typeof Swal.fire>);
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    fireSpy.mockRestore();
  });

  it('should be created when injected', () => {
    // Act / Assert
    expect(service).toBeTruthy();
  });

  describe('showMessage', () => {
    it('should dispatch to success when the type is "Success"', () => {
      // Act
      service.showMessage('Success', 'Salvo com sucesso');

      // Assert
      expect(fireSpy).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'success', text: 'Salvo com sucesso', background: '#198754' }),
      );
    });

    it('should dispatch to error when the type is "Error"', () => {
      // Act
      service.showMessage('Error', 'Falha ao salvar');

      // Assert
      expect(fireSpy).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'error', text: 'Falha ao salvar', background: '#dc3545' }),
      );
    });

    it('should dispatch to info when the type is "Info"', () => {
      // Act
      service.showMessage('Info', 'Aviso informativo');

      // Assert
      expect(fireSpy).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'info', text: 'Aviso informativo', background: '#0d6efd' }),
      );
    });

    it('should dispatch to warning when the type is "Warning"', () => {
      // Act
      service.showMessage('Warning', 'Atenção');

      // Assert
      expect(fireSpy).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'warning', text: 'Atenção', background: '#ffc107' }),
      );
    });

    it('should match the type case-insensitively when the caller passes a lowercase literal', () => {
      // Act
      service.showMessage('error', 'Falha ao salvar');

      // Assert
      expect(fireSpy).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error' }));
    });

    it('should fall back to error when the type is unrecognized', () => {
      // Act
      service.showMessage('SomethingElse', 'Mensagem');

      // Assert
      expect(fireSpy).toHaveBeenCalledWith(
        expect.objectContaining({ icon: 'error', text: 'Mensagem' }),
      );
    });

    it('should fall back to error when the type is undefined', () => {
      // Act
      service.showMessage(undefined as unknown as string, 'Mensagem');

      // Assert
      expect(fireSpy).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error' }));
    });

    it('should pass the title through to the underlying Swal handler call', () => {
      // Act
      service.showMessage('Success', 'Mensagem', 'Título');

      // Assert
      expect(fireSpy).toHaveBeenCalledWith(expect.objectContaining({ text: 'Mensagem' }));
    });
  });
});
