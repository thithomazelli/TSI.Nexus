import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { TranslationService } from '../translation/translation.service';
import { ModalService } from './modal.service';

describe('ModalService', () => {
  let dialogMock: { open: ReturnType<typeof vi.fn>; closeAll: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let fireSpy: ReturnType<typeof vi.spyOn>;

  function createService(): ModalService {
    dialogMock = { open: vi.fn(), closeAll: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };

    return new ModalService(
      dialogMock as unknown as MatDialog,
      translationServiceMock as unknown as TranslationService,
    );
  }

  beforeEach(() => {
    fireSpy = vi
      .spyOn(Swal, 'fire')
      .mockReturnValue(undefined as unknown as ReturnType<typeof Swal.fire>);
  });

  afterEach(() => {
    fireSpy.mockRestore();
  });

  it('should create the service when instantiated', () => {
    // Act
    // Assert
    expect(createService()).toBeTruthy();
  });

  describe('showTemplateModal', () => {
    it('should open a dialog with the given component and default width when called with data', () => {
      // Arrange
      const service = createService();
      const Component = class {};

      // Act
      service.showTemplateModal(Component, { foo: 'bar' });

      // Assert
      expect(dialogMock.open).toHaveBeenCalledWith(
        Component,
        expect.objectContaining({
          data: { foo: 'bar' },
          width: '760px',
          disableClose: false,
          panelClass: 'custom-modal',
          autoFocus: false,
        }),
      );
    });

    it('should include the id in dialogData when the id is present', () => {
      // Arrange
      const service = createService();

      // Act
      service.showTemplateModal(class {}, { id: 'x1' });

      // Assert
      expect(dialogMock.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: expect.objectContaining({ id: 'x1' }) }),
      );
    });

    it('should include the parentId in dialogData when the parentId is present', () => {
      // Arrange
      const service = createService();

      // Act
      service.showTemplateModal(class {}, { parentId: 'p1' });

      // Assert
      expect(dialogMock.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: expect.objectContaining({ parentId: 'p1' }) }),
      );
    });

    it('should use the custom width when a width is provided', () => {
      // Arrange
      const service = createService();

      // Act
      service.showTemplateModal(class {}, { width: '900px' });

      // Assert
      expect(dialogMock.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ width: '900px' }),
      );
    });

    it('should honor disableClose when it is set', () => {
      // Arrange
      const service = createService();

      // Act
      service.showTemplateModal(class {}, { disableClose: true });

      // Assert
      expect(dialogMock.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ disableClose: true }),
      );
    });

    it('should open the dialog with default data when no data is provided', () => {
      // Arrange
      const service = createService();

      // Act
      service.showTemplateModal(class {});

      // Assert
      expect(dialogMock.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: {}, width: '760px', disableClose: false }),
      );
    });
  });

  describe('showNotification', () => {
    it('should open the notification dialog with the given data when called', () => {
      // Arrange
      const service = createService();

      // Act
      service.showNotification(true, 'Título', 'Mensagem');

      // Assert
      expect(dialogMock.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: { isSuccess: true, title: 'Título', message: 'Mensagem' },
          width: '400px',
          panelClass: 'custom-modal',
          autoFocus: false,
        }),
      );
    });
  });

  describe('showSweetNotification', () => {
    it.each([
      ['success', 'success'],
      ['ok', 'success'],
      ['error', 'error'],
      ['fail', 'error'],
      ['failed', 'error'],
      ['warning', 'warning'],
      ['warn', 'warning'],
      ['alert', 'warning'],
    ])('should map status "%s" to icon "%s" when showSweetNotification is called', (status, expectedIcon) => {
      // Arrange
      const service = createService();

      // Act
      service.showSweetNotification('Título', 'Texto', status);

      // Assert
      expect(fireSpy).toHaveBeenCalledWith(
        expect.objectContaining({ icon: expectedIcon, title: 'Título', text: 'Texto' }),
      );
    });

    it('should map an unrecognized status to the info icon when the status is not recognized', () => {
      // Arrange
      const service = createService();

      // Act
      service.showSweetNotification('Título', 'Texto', 'something-else');

      // Assert
      expect(fireSpy).toHaveBeenCalledWith(expect.objectContaining({ icon: 'info' }));
    });

    it('should match the status case-insensitively when the status has different casing', () => {
      // Arrange
      const service = createService();

      // Act
      service.showSweetNotification('Título', 'Texto', 'SUCCESS');

      // Assert
      expect(fireSpy).toHaveBeenCalledWith(expect.objectContaining({ icon: 'success' }));
    });
  });

  describe('showConfirmation', () => {
    it('should open the confirmation dialog with the given data when called', () => {
      // Arrange
      const service = createService();

      // Act
      service.showConfirmation({ message: 'Tem certeza?' });

      // Assert
      expect(dialogMock.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: { message: 'Tem certeza?' },
          width: '400px',
          panelClass: 'custom-modal',
          autoFocus: false,
        }),
      );
    });
  });

  describe('showSweetConfirmation', () => {
    it('should fire a question confirmation with translated default button labels when no custom options are provided', () => {
      // Arrange
      const service = createService();

      // Act
      service.showSweetConfirmation('Título', 'Texto');

      // Assert
      expect(fireSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Título',
          text: 'Texto',
          icon: 'question',
          confirmButtonText: 'COMMON.YES',
          cancelButtonText: 'COMMON.CANCEL',
        }),
      );
    });

    it('should use a warning icon and custom button labels when they are provided', () => {
      // Arrange
      const service = createService();

      // Act
      service.showSweetConfirmation('Título', 'Texto', 'warning', 'Sim', 'Não');

      // Assert
      expect(fireSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'warning',
          confirmButtonText: 'Sim',
          cancelButtonText: 'Não',
        }),
      );
    });
  });

  describe('showPdfProgress', () => {
    it('should open the pdf progress dialog and delegate handle calls to the component instance when showPdfProgress is called', () => {
      // Arrange
      const service = createService();
      const instance = {
        setProgress: vi.fn(),
        setIndeterminate: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
      };
      dialogMock.open.mockReturnValue({ componentInstance: instance });

      // Act
      const handle = service.showPdfProgress('Gerando PDF');

      // Assert
      expect(dialogMock.open).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          data: { title: 'Gerando PDF' },
          width: '420px',
          disableClose: true,
          panelClass: 'custom-modal',
          autoFocus: false,
        }),
      );

      // Act
      handle.setProgress(2, 5);
      // Assert
      expect(instance.setProgress).toHaveBeenCalledWith(2, 5);

      // Act
      handle.setIndeterminate();
      // Assert
      expect(instance.setIndeterminate).toHaveBeenCalled();

      // Act
      handle.success('Concluído', { name: 'a.pdf' } as any);
      // Assert
      expect(instance.success).toHaveBeenCalledWith('Concluído', { name: 'a.pdf' });

      // Act
      handle.error('Falhou');
      // Assert
      expect(instance.error).toHaveBeenCalledWith('Falhou');
    });
  });

  describe('hideModal', () => {
    it('should close the given dialogRef when a dialogRef is provided', () => {
      // Arrange
      const service = createService();
      const dialogRef = { close: vi.fn() } as unknown as MatDialogRef<any>;

      // Act
      service.hideModal(dialogRef);

      // Assert
      expect(dialogRef.close).toHaveBeenCalled();
      expect(dialogMock.closeAll).not.toHaveBeenCalled();
    });

    it('should close all dialogs when no dialogRef is given', () => {
      // Arrange
      const service = createService();

      // Act
      service.hideModal();

      // Assert
      expect(dialogMock.closeAll).toHaveBeenCalled();
    });
  });
});
