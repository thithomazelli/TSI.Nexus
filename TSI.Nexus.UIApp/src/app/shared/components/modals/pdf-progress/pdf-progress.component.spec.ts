import { MatDialogRef } from '@angular/material/dialog';
import { TranslationService } from '@nexus/core';
import { PdfProgressComponent } from './pdf-progress.component';

describe('PdfProgressComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn>; disableClose: boolean };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };

  function createComponent(title = 'Gerando PDF') {
    dialogRefMock = { close: vi.fn(), disableClose: true };
    translationServiceMock = {
      instant: vi.fn((key: string, params?: Record<string, string>) =>
        params ? `${key} ${params['current']}/${params['total']}` : key,
      ),
    };
    return new PdfProgressComponent(
      { title },
      dialogRefMock as unknown as MatDialogRef<PdfProgressComponent>,
      translationServiceMock as unknown as TranslationService,
    );
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create in the indeterminate state with the given title when instantiated', () => {
    // Act
    const component = createComponent('Gerando relatório');

    // Assert
    expect(component.state).toBe('indeterminate');
    expect(component.title).toBe('Gerando relatório');
  });

  it('should compute a clamped percentage and a translated label when setProgress is called', () => {
    // Arrange
    const component = createComponent();

    // Act
    component.setProgress(3, 10);

    // Assert
    expect(component.state).toBe('progress');
    expect(component.percent).toBe(30);
    expect(component.label).toBe('PDF_EXPORT.PAGE_PROGRESS 3/10');
  });

  it('should treat a zero total as zero percent when setProgress is called with zero total', () => {
    // Arrange
    const component = createComponent();

    // Act
    component.setProgress(0, 0);

    // Assert
    expect(component.percent).toBe(0);
  });

  it('should clamp the percentage at 100 when setProgress exceeds the total', () => {
    // Arrange
    const component = createComponent();

    // Act
    component.setProgress(15, 10);

    // Assert
    expect(component.percent).toBe(100);
  });

  it('should reset the state when setIndeterminate is called', () => {
    // Arrange
    const component = createComponent();
    component.setProgress(5, 10);

    // Act
    component.setIndeterminate();

    // Assert
    expect(component.state).toBe('indeterminate');
  });

  it('should store the message and file and re-enable closing the dialog when success is called', () => {
    // Arrange
    const component = createComponent();
    const file = { url: 'blob:x', name: 'report.pdf' };

    // Act
    component.success('Pronto!', file);

    // Assert
    expect(component.state).toBe('success');
    expect(component.message).toBe('Pronto!');
    expect(component.file).toBe(file);
    expect(dialogRefMock.disableClose).toBe(false);
  });

  it('should leave file null when success is called without a file', () => {
    // Arrange
    const component = createComponent();

    // Act
    component.success('Pronto!');

    // Assert
    expect(component.file).toBeNull();
  });

  it('should store the message and re-enable closing the dialog when error is called', () => {
    // Arrange
    const component = createComponent();

    // Act
    component.error('Falhou');

    // Assert
    expect(component.state).toBe('error');
    expect(component.message).toBe('Falhou');
    expect(dialogRefMock.disableClose).toBe(false);
  });

  it('should open the stored file URL in a new tab when openFile is called', () => {
    // Arrange
    const component = createComponent();
    component.success('Pronto!', { url: 'blob:x', name: 'report.pdf' });
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    // Act
    component.openFile();

    // Assert
    expect(openSpy).toHaveBeenCalledWith('blob:x', '_blank');
  });

  it('should do nothing when openFile is called without a file', () => {
    // Arrange
    const component = createComponent();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    // Act
    component.openFile();

    // Assert
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('should close the dialog when close is called', () => {
    // Arrange
    const component = createComponent();

    // Act
    component.close();

    // Assert
    expect(dialogRefMock.close).toHaveBeenCalled();
  });

  it('should revoke the file object URL when ngOnDestroy is called with a file present', () => {
    // Arrange
    const component = createComponent();
    component.success('Pronto!', { url: 'blob:x', name: 'report.pdf' });
    const revokeSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});

    // Act
    component.ngOnDestroy();

    // Assert
    expect(revokeSpy).toHaveBeenCalledWith('blob:x');
  });

  it('should do nothing when ngOnDestroy is called without a file', () => {
    // Arrange
    const component = createComponent();
    const revokeSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});

    // Act
    component.ngOnDestroy();

    // Assert
    expect(revokeSpy).not.toHaveBeenCalled();
  });
});
