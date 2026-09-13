import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, DocumentTemplateType } from '@nexus/core';
import { DocumentTemplateService } from './document-template.service';

describe('DocumentTemplateService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    getBlob: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };

  function createService(): DocumentTemplateService {
    apiServiceMock = { get: vi.fn(), getBlob: vi.fn(), post: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(DocumentTemplateService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit the expected endpoint when getAll is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getAll();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('documenttemplates/getAll');
  });

  it('should hit the expected endpoint when getByType is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getByType(DocumentTemplateType.Quote);

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith(
      `documenttemplates/getByType/${DocumentTemplateType.Quote}`,
    );
  });

  it('should fetch the blob from the expected endpoint when download is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.getBlob.mockReturnValue(new Subject());

    // Act
    service.download(DocumentTemplateType.Quote);

    // Assert
    expect(apiServiceMock.getBlob).toHaveBeenCalledWith(
      `documenttemplates/download/${DocumentTemplateType.Quote}`,
    );
  });

  it('should send the file as form data to the expected endpoint when upload is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.post.mockReturnValue(new Subject());
    const file = new File(['content'], 'template.docx');

    // Act
    service.upload(DocumentTemplateType.Quote, file);

    // Assert
    expect(apiServiceMock.post).toHaveBeenCalledWith(
      `documenttemplates/upload/${DocumentTemplateType.Quote}`,
      expect.any(FormData),
    );
    const formData = apiServiceMock.post.mock.calls[0][1] as FormData;
    expect(formData.get('file')).toBe(file);
  });
});
