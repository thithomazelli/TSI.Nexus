import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import {
  DocumentTemplate,
  DocumentTemplateService,
  DocumentTemplateType,
  NotificationService,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { DocumentTemplatesComponent } from './document-templates.component';

describe('DocumentTemplatesComponent', () => {
  let documentTemplateServiceMock: {
    getAll: ReturnType<typeof vi.fn>;
    download: ReturnType<typeof vi.fn>;
    upload: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent() {
    documentTemplateServiceMock = {
      getAll: vi.fn().mockReturnValue(of({ data: [] })),
      download: vi.fn(),
      upload: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new DocumentTemplatesComponent(
      documentTemplateServiceMock as unknown as DocumentTemplateService,
      notificationServiceMock as unknown as NotificationService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  beforeEach(() => {
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(document, 'createElement').mockReturnValue({
      set href(_: string) {},
      set download(_: string) {},
      click: vi.fn(),
    } as unknown as HTMLAnchorElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  it('should load all templates and mark for check when ngOnInit is called', () => {
    // Arrange
    const templates = [{ type: DocumentTemplateType.Quote }] as DocumentTemplate[];
    const component = createComponent();
    documentTemplateServiceMock.getAll.mockReturnValue(of({ data: templates }));

    // Act
    component.ngOnInit();

    // Assert
    expect(component.templates).toBe(templates);
    expect(component.loading).toBe(false);
    expect(cdrMock.markForCheck).toHaveBeenCalled();
  });

  it('should stop loading and mark for check when the load request errors out', () => {
    // Arrange
    const component = createComponent();
    documentTemplateServiceMock.getAll.mockReturnValue(throwError(() => new Error('boom')));

    // Act
    component.ngOnInit();

    // Assert
    expect(component.loading).toBe(false);
    expect(cdrMock.markForCheck).toHaveBeenCalled();
  });

  it('should default to an empty list when the response has no data', () => {
    // Arrange
    const component = createComponent();
    documentTemplateServiceMock.getAll.mockReturnValue(of({}));

    // Act
    component.ngOnInit();

    // Assert
    expect(component.templates).toEqual([]);
  });

  describe('getFileExtension', () => {
    it('should return jpg when the type is Letterhead', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.getFileExtension(DocumentTemplateType.Letterhead)).toBe('jpg');
    });

    it('should return png when the type is Signature', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.getFileExtension(DocumentTemplateType.Signature)).toBe('png');
    });

    it('should return docx when the type is any other value or undefined', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.getFileExtension(DocumentTemplateType.Quote)).toBe('docx');
      expect(component.getFileExtension(undefined)).toBe('docx');
    });
  });

  describe('getFileInputAccept', () => {
    it('should match the accept filter to the file extension when given each template type', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.getFileInputAccept(DocumentTemplateType.Letterhead)).toBe('.jpg,.jpeg,image/jpeg');
      expect(component.getFileInputAccept(DocumentTemplateType.Signature)).toBe('.png,image/png');
      expect(component.getFileInputAccept(DocumentTemplateType.Quote)).toBe(
        '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    });
  });

  describe('download', () => {
    it('should do nothing when the template has no type', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.download({} as DocumentTemplate);

      // Assert
      expect(documentTemplateServiceMock.download).not.toHaveBeenCalled();
    });

    it('should download the template blob under its own fileName when the template has a fileName', () => {
      // Arrange
      const blob = new Blob(['x']);
      const component = createComponent();
      documentTemplateServiceMock.download.mockReturnValue(of(blob));

      // Act
      component.download({ type: DocumentTemplateType.Quote, fileName: 'orcamento.docx' } as DocumentTemplate);

      // Assert
      expect(documentTemplateServiceMock.download).toHaveBeenCalledWith(DocumentTemplateType.Quote);
    });

    it('should fall back to a type-based filename when fileName is absent', () => {
      // Arrange
      const blob = new Blob(['x']);
      const component = createComponent();
      documentTemplateServiceMock.download.mockReturnValue(of(blob));

      // Act
      // Assert
      expect(() =>
        component.download({ type: DocumentTemplateType.Letterhead } as DocumentTemplate),
      ).not.toThrow();
    });
  });

  it('should click the given file input when triggerUpload is called', () => {
    // Arrange
    const component = createComponent();
    const input = { click: vi.fn() } as unknown as HTMLInputElement;

    // Act
    component.triggerUpload(input);

    // Assert
    expect(input.click).toHaveBeenCalled();
  });

  describe('onFileSelected', () => {
    function fileEvent(file: File | null): Event {
      return { target: { files: file ? [file] : [], value: '' } } as unknown as Event;
    }

    it('should do nothing when no file was selected', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onFileSelected(fileEvent(null), { type: DocumentTemplateType.Quote } as DocumentTemplate);

      // Assert
      expect(documentTemplateServiceMock.upload).not.toHaveBeenCalled();
    });

    it('should do nothing when the template has no type', () => {
      // Arrange
      const component = createComponent();
      const file = new File(['x'], 'a.docx');

      // Act
      component.onFileSelected(fileEvent(file), {} as DocumentTemplate);

      // Assert
      expect(documentTemplateServiceMock.upload).not.toHaveBeenCalled();
    });

    it('should upload the file, apply the returned fileName, and mark for check when the upload succeeds', () => {
      // Arrange
      const file = new File(['x'], 'a.docx');
      const response = { status: ResponseStatus.Success, message: 'ok', data: { fileName: 'novo.docx' } };
      const component = createComponent();
      documentTemplateServiceMock.upload.mockReturnValue(of(response));
      const template = { type: DocumentTemplateType.Quote } as DocumentTemplate;

      // Act
      component.onFileSelected(fileEvent(file), template);

      // Assert
      expect(documentTemplateServiceMock.upload).toHaveBeenCalledWith(DocumentTemplateType.Quote, file);
      expect(template.fileName).toBe('novo.docx');
      expect(component.uploadingType).toBeNull();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(response.status, response.message);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should not apply fileName when the backend reports a non-success status', () => {
      // Arrange
      const file = new File(['x'], 'a.docx');
      const response = { status: ResponseStatus.Error, message: 'falhou', data: { fileName: 'novo.docx' } };
      const component = createComponent();
      documentTemplateServiceMock.upload.mockReturnValue(of(response));
      const template = { type: DocumentTemplateType.Quote, fileName: 'antigo.docx' } as DocumentTemplate;

      // Act
      component.onFileSelected(fileEvent(file), template);

      // Assert
      expect(template.fileName).toBe('antigo.docx');
    });

    it('should show a translated error notification, clear uploadingType, and mark for check when the request errors out', () => {
      // Arrange
      const file = new File(['x'], 'a.docx');
      const component = createComponent();
      documentTemplateServiceMock.upload.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.onFileSelected(fileEvent(file), { type: DocumentTemplateType.Quote } as DocumentTemplate);

      // Assert
      expect(component.uploadingType).toBeNull();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Error', 'DOCUMENT_TEMPLATES.UPDATE_ERROR');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });
});
