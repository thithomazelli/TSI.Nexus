import { TestBed } from '@angular/core/testing';
import { ApiService } from '@nexus/core';
import { PhotoService } from './photo.service';

describe('PhotoService', () => {
  let apiServiceMock: {
    post: ReturnType<typeof vi.fn>;
    getBlob: ReturnType<typeof vi.fn>;
  };

  function createService(): PhotoService {
    apiServiceMock = { post: vi.fn(), getBlob: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(PhotoService);
  }

  it('should be created when instantiated', () => {
    // Act
    // Assert
    expect(createService()).toBeTruthy();
  });

  it('should start with an empty photoPath when subscribed to', () => {
    // Arrange
    const service = createService();
    let latest: { photoPath: string; userId?: string } | undefined;

    // Act
    service.photo$.subscribe((v) => (latest = v));
    TestBed.flushEffects();

    // Assert
    expect(latest).toEqual({ photoPath: '' });
  });

  it('should update photo$ with the new path and userId when updateUserPhoto is called', () => {
    // Arrange
    const service = createService();
    let latest: { photoPath: string; userId?: string } | undefined;
    service.photo$.subscribe((v) => (latest = v));
    TestBed.flushEffects();

    // Act
    service.updateUserPhoto('photos/u1.jpg', 'u1');
    TestBed.flushEffects();

    // Assert
    expect(latest).toEqual({ photoPath: 'photos/u1.jpg', userId: 'u1' });
  });

  it('should post a FormData with entity, entityId and file when uploadPhoto is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.post.mockReturnValue({ subscribe: vi.fn() });
    const file = new File(['x'], 'photo.png');

    // Act
    service.uploadPhoto('drivers', 'd1', file);

    // Assert
    expect(apiServiceMock.post).toHaveBeenCalledTimes(1);
    const [url, formData] = apiServiceMock.post.mock.calls[0];
    expect(url).toBe('photos/uploadPhoto');
    expect(formData).toBeInstanceOf(FormData);
    expect((formData as FormData).get('entity')).toBe('drivers');
    expect((formData as FormData).get('entityId')).toBe('d1');
    const uploadedFile = (formData as FormData).get('file') as File;
    expect(uploadedFile.name).toBe(file.name);
  });

  it('should post a FormData with entity and entityId but no file when removePhoto is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.post.mockReturnValue({ subscribe: vi.fn() });

    // Act
    service.removePhoto('drivers', 'd1');

    // Assert
    expect(apiServiceMock.post).toHaveBeenCalledTimes(1);
    const [url, formData] = apiServiceMock.post.mock.calls[0];
    expect(url).toBe('photos/uploadPhoto');
    expect((formData as FormData).get('entity')).toBe('drivers');
    expect((formData as FormData).get('entityId')).toBe('d1');
    expect((formData as FormData).get('file')).toBeNull();
  });

  it('should build the query string and delegate to getBlob when getPhoto is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.getBlob.mockReturnValue({ subscribe: vi.fn() });

    // Act
    service.getPhoto('drivers', 'd1', 'photo.png');

    // Assert
    expect(apiServiceMock.getBlob).toHaveBeenCalledWith(
      'photos/getPhoto?entity=drivers&entityId=d1&fileName=photo.png',
    );
  });
});
