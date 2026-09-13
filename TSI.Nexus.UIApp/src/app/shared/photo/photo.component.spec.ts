import { ChangeDetectorRef, ElementRef } from '@angular/core';
import {
  Attachment,
  AttachmentService,
  ModalService,
  PhotoService,
  TranslationService,
} from '@nexus/core';
import { of, throwError } from 'rxjs';
import { PhotoComponent } from './photo.component';

describe('PhotoComponent', () => {
  let cdMock: { detectChanges: ReturnType<typeof vi.fn> };
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    showSweetConfirmation: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let attachmentServiceMock: {
    add: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getByUserId: ReturnType<typeof vi.fn>;
    getByBusinessPartnerId: ReturnType<typeof vi.fn>;
    getByProductId: ReturnType<typeof vi.fn>;
    getByOrderId: ReturnType<typeof vi.fn>;
    getByTransactionId: ReturnType<typeof vi.fn>;
    getByPaymentId: ReturnType<typeof vi.fn>;
    getByVehicleId: ReturnType<typeof vi.fn>;
    getByDriverId: ReturnType<typeof vi.fn>;
  };
  let photoServiceMock: {
    getPhoto: ReturnType<typeof vi.fn>;
    uploadPhoto: ReturnType<typeof vi.fn>;
    removePhoto: ReturnType<typeof vi.fn>;
    updateUserPhoto: ReturnType<typeof vi.fn>;
  };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };

  function createComponent(): PhotoComponent {
    cdMock = { detectChanges: vi.fn() };
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      showSweetConfirmation: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    attachmentServiceMock = {
      add: vi.fn(),
      delete: vi.fn().mockReturnValue(of(null)),
      getByUserId: vi.fn(),
      getByBusinessPartnerId: vi.fn(),
      getByProductId: vi.fn(),
      getByOrderId: vi.fn(),
      getByTransactionId: vi.fn(),
      getByPaymentId: vi.fn(),
      getByVehicleId: vi.fn(),
      getByDriverId: vi.fn(),
    };
    photoServiceMock = {
      getPhoto: vi.fn(),
      uploadPhoto: vi.fn(),
      removePhoto: vi.fn(),
      updateUserPhoto: vi.fn(),
    };
    translationServiceMock = { instant: vi.fn((key: string) => key) };

    return new PhotoComponent(
      cdMock as unknown as ChangeDetectorRef,
      modalServiceMock as unknown as ModalService,
      attachmentServiceMock as unknown as AttachmentService,
      photoServiceMock as unknown as PhotoService,
      translationServiceMock as unknown as TranslationService,
    );
  }

  beforeEach(() => {
    if (!('createObjectURL' in URL)) {
      (URL as any).createObjectURL = () => '';
    }
    if (!('revokeObjectURL' in URL)) {
      (URL as any).revokeObjectURL = () => {};
    }
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create the component when instantiated', () => {
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('loadPhoto (via ngOnInit)', () => {
    it('should set the placeholder image when there is no data', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.imageUrl).toBe('assets/img/no_photo_generic.svg');
    });

    it('should fetch and show the photo when data, entityClass, photo and id are all present', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: 'photo.png' };
      const blob = new Blob(['x']);
      photoServiceMock.getPhoto.mockReturnValue(of(blob));

      // Act
      component.ngOnInit();

      // Assert
      expect(photoServiceMock.getPhoto).toHaveBeenCalledWith('Users', 'u1', 'photo.png');
      expect(component.imageUrl).toBe('blob:fake');
      expect(cdMock.detectChanges).toHaveBeenCalled();
    });

    it('should revoke the previously created object URL when loadPhoto assigns a new one', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: 'photo.png' };
      photoServiceMock.getPhoto.mockReturnValue(of(new Blob(['x'])));

      // Act
      component.loadPhoto();
      component.loadPhoto();

      // Assert
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
    });

    it('should fall back to the placeholder image and mark for check when the fetch errors', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: 'photo.png' };
      photoServiceMock.getPhoto.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.loadPhoto();

      // Assert
      expect(component.imageUrl).toBe('assets/img/no_profile.png');
      expect(cdMock.detectChanges).toHaveBeenCalled();
    });

    it('should set the placeholder image when the entity has no photo set', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1' };

      // Act
      component.loadPhoto();

      // Assert
      expect(photoServiceMock.getPhoto).not.toHaveBeenCalled();
      expect(component.imageUrl).toBe('assets/img/no_profile.png');
    });
  });

  describe('ngOnChanges', () => {
    it('should reload the photo when imageUrl changes and data.photo is set', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: 'photo.png' };
      photoServiceMock.getPhoto.mockReturnValue(of(new Blob(['x'])));

      // Act
      component.ngOnChanges({ imageUrl: {} as any });

      // Assert
      expect(photoServiceMock.getPhoto).toHaveBeenCalled();
    });

    it('should do nothing when the changed input is not imageUrl', () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'u1', photo: 'photo.png' };

      // Assert
      expect(() => component.ngOnChanges({ entityClass: {} as any })).not.toThrow();
      expect(photoServiceMock.getPhoto).not.toHaveBeenCalled();
    });

    it('should do nothing when there is no data', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(() => component.ngOnChanges({ imageUrl: {} as any })).not.toThrow();
    });

    it('should do nothing when data has no photo', () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'u1' };

      // Assert
      expect(() => component.ngOnChanges({ imageUrl: {} as any })).not.toThrow();
      expect(photoServiceMock.getPhoto).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should revoke the last object URL when one was created', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: 'photo.png' };
      photoServiceMock.getPhoto.mockReturnValue(of(new Blob(['x'])));
      component.loadPhoto();

      // Act
      component.ngOnDestroy();

      // Assert
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
    });

    it('should not throw when no object URL was ever created', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it('should swallow an error thrown by revokeObjectURL', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: 'photo.png' };
      photoServiceMock.getPhoto.mockReturnValue(of(new Blob(['x'])));
      component.loadPhoto();
      (URL.revokeObjectURL as any).mockImplementation(() => {
        throw new Error('boom');
      });

      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('onImgError', () => {
    it('should replace the broken image src with the placeholder image', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Vehicles';
      const img = document.createElement('img');

      // Act
      component.onImgError({ target: img } as unknown as Event);

      // Assert
      expect(img.src).toContain('no_photo_generic.svg');
    });
  });

  describe('triggerFile', () => {
    it('should click the native file input when present', () => {
      // Arrange
      const component = createComponent();
      const input = document.createElement('input');
      const clickSpy = vi.spyOn(input, 'click');
      component.fileInput = new ElementRef(input);

      // Act
      component.triggerFile();

      // Assert
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should not throw when the file input is not yet available', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(() => component.triggerFile()).not.toThrow();
    });
  });

  describe('onFileSelected', () => {
    function fileEvent(file: File | null): Event {
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: file ? [file] : [],
        writable: false,
      });
      return { target: input } as unknown as Event;
    }

    it('should do nothing when no file was selected', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(() => component.onFileSelected(fileEvent(null))).not.toThrow();
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
    });

    it('should do nothing when the selected file is not an image', () => {
      // Arrange
      const component = createComponent();
      const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });

      // Act
      component.onFileSelected(fileEvent(file));

      // Assert
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
    });

    it('should open the crop modal when a valid image file is selected', () => {
      // Arrange
      const component = createComponent();
      const file = new File(['x'], 'photo.png', { type: 'image/png' });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(undefined) });

      // Act
      component.onFileSelected(fileEvent(file));

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ source: file }),
      );
    });

    it('should reset the input value after handling the selection', () => {
      // Arrange
      const component = createComponent();
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [], writable: false });
      input.value = 'C:\\fakepath\\photo.png';

      // Act
      component.onFileSelected({ target: input } as unknown as Event);

      // Assert
      expect(input.value).toBe('');
    });
  });

  describe('openCamera', () => {
    it('should open the crop modal when a photo was captured', () => {
      // Arrange
      const component = createComponent();
      const file = new File(['x'], 'capture.png', { type: 'image/png' });
      modalServiceMock.showTemplateModal
        .mockReturnValueOnce({ afterClosed: () => of(file) })
        .mockReturnValueOnce({ afterClosed: () => of(undefined) });

      // Act
      component.openCamera();

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledTimes(2);
    });

    it('should do nothing further when the camera modal closes without a file', () => {
      // Arrange
      const component = createComponent();
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(undefined) });

      // Act
      component.openCamera();

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledTimes(1);
    });
  });

  describe('removePhotoConfirm', () => {
    it('should do nothing when there is no data id', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = {};

      // Act
      component.removePhotoConfirm();

      // Assert
      expect(modalServiceMock.showSweetConfirmation).not.toHaveBeenCalled();
    });

    it('should do nothing when there is no entityClass', () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'u1' };

      // Act
      component.removePhotoConfirm();

      // Assert
      expect(modalServiceMock.showSweetConfirmation).not.toHaveBeenCalled();
    });

    it('should remove the photo when the user confirms', async () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: 'photo.png' };
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      attachmentServiceMock.getByUserId.mockReturnValue(of({ data: [] }));
      photoServiceMock.removePhoto.mockReturnValue(of(null));

      // Act
      component.removePhotoConfirm();
      await Promise.resolve();

      // Assert
      expect(photoServiceMock.removePhoto).toHaveBeenCalledWith('Users', 'u1');
    });

    it('should do nothing further when the user declines', async () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: 'photo.png' };
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.removePhotoConfirm();
      await Promise.resolve();

      // Assert
      expect(photoServiceMock.removePhoto).not.toHaveBeenCalled();
    });
  });

  describe('uploadCroppedPhoto (via onFileSelected)', () => {
    function uploadFlow(component: PhotoComponent, blob: Blob) {
      const file = new File(['x'], 'photo.png', { type: 'image/png' });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(blob) });
      const inputEvent = { target: (() => {
        const input = document.createElement('input');
        Object.defineProperty(input, 'files', { value: [file], writable: false });
        return input;
      })() } as unknown as Event;
      component.onFileSelected(inputEvent);
    }

    it('should do nothing when there is no data id', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = {};

      // Act
      uploadFlow(component, new Blob(['x'], { type: 'image/png' }));

      // Assert
      expect(attachmentServiceMock.add).not.toHaveBeenCalled();
    });

    it('should do nothing when there is no entityClass', () => {
      // Arrange
      const component = createComponent();
      component.data = { id: 'u1' };

      // Act
      uploadFlow(component, new Blob(['x'], { type: 'image/png' }));

      // Assert
      expect(attachmentServiceMock.add).not.toHaveBeenCalled();
    });

    it('should attach then upload the photo, updating the entity photo path and notifying', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: '' };
      attachmentServiceMock.add.mockReturnValue(of(null));
      photoServiceMock.uploadPhoto.mockReturnValue(of({ fileName: 'new.png' }));
      photoServiceMock.getPhoto.mockReturnValue(of(new Blob(['x'])));

      // Act
      uploadFlow(component, new Blob(['x'], { type: 'image/png' }));

      // Assert
      expect(attachmentServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'u1' }),
        'photos/Users',
      );
      expect(component.data.photo).toBe('new.png');
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        'Foto atualizada',
        'Upload realizado com sucesso!',
        'success',
      );
      expect(photoServiceMock.updateUserPhoto).toHaveBeenCalledWith('new.png', 'u1');
    });

    it('should fall back to the upload response path when fileName is absent', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Vehicles';
      component.data = { id: 'v1', photo: '' };
      attachmentServiceMock.add.mockReturnValue(of(null));
      photoServiceMock.uploadPhoto.mockReturnValue(of({ path: 'from-path.png' }));
      photoServiceMock.getPhoto.mockReturnValue(of(new Blob(['x'])));

      // Act
      uploadFlow(component, new Blob(['x'], { type: 'image/png' }));

      // Assert
      expect(component.data.photo).toBe('from-path.png');
      expect(photoServiceMock.updateUserPhoto).not.toHaveBeenCalled();
    });

    it('should fall back to an empty photo path when the upload response has neither fileName nor path', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Vehicles';
      component.data = { id: 'v1', photo: '' };
      attachmentServiceMock.add.mockReturnValue(of(null));
      photoServiceMock.uploadPhoto.mockReturnValue(of({}));
      photoServiceMock.getPhoto.mockReturnValue(of(new Blob(['x'])));

      // Act
      uploadFlow(component, new Blob(['x'], { type: 'image/png' }));

      // Assert
      expect(component.data.photo).toBe('');
    });

    it('should default the uploaded file type to image/png when the blob has no type', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: '' };
      attachmentServiceMock.add.mockReturnValue(of(null));
      photoServiceMock.uploadPhoto.mockReturnValue(of({}));
      photoServiceMock.getPhoto.mockReturnValue(of(new Blob(['x'])));

      // Act
      uploadFlow(component, new Blob(['x']));

      // Assert
      const uploadedFile = photoServiceMock.uploadPhoto.mock.calls[0][2] as File;
      expect(uploadedFile.type).toBe('image/png');
    });

    it('should proceed to upload even when attaching the file fails', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: '' };
      attachmentServiceMock.add.mockReturnValue(throwError(() => new Error('boom')));
      photoServiceMock.uploadPhoto.mockReturnValue(of({ fileName: 'new.png' }));
      photoServiceMock.getPhoto.mockReturnValue(of(new Blob(['x'])));

      // Act
      uploadFlow(component, new Blob(['x'], { type: 'image/png' }));

      // Assert
      expect(photoServiceMock.uploadPhoto).toHaveBeenCalled();
    });

    it('should show an error notification when the upload request fails', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: '' };
      attachmentServiceMock.add.mockReturnValue(of(null));
      photoServiceMock.uploadPhoto.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      uploadFlow(component, new Blob(['x'], { type: 'image/png' }));

      // Assert
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Erro ao salvar foto.',
        'error',
      );
    });

    it('should do nothing further when the crop modal closes without a cropped blob', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1' };

      // Act
      uploadFlow(component, undefined as unknown as Blob);

      // Assert
      expect(attachmentServiceMock.add).not.toHaveBeenCalled();
    });
  });

  describe('performRemove (via removePhotoConfirm)', () => {
    async function removeFlow(component: PhotoComponent) {
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      component.removePhotoConfirm();
      await Promise.resolve();
    }

    it('should find and delete the matching attachment, then clear the entity photo, notify and mark for check', async () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: 'photo.png' };
      attachmentServiceMock.getByUserId.mockReturnValue(
        of({ data: [{ id: 'a1', fileName: 'photo.png' } as Attachment] }),
      );
      photoServiceMock.removePhoto.mockReturnValue(of(null));

      // Act
      await removeFlow(component);

      // Assert
      expect(attachmentServiceMock.delete).toHaveBeenCalledWith('a1');
      expect(component.data.photo).toBe('');
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        'Foto removida',
        'Foto removida com sucesso!',
        'success',
      );
      expect(photoServiceMock.updateUserPhoto).toHaveBeenCalledWith('', 'u1');
      expect(cdMock.detectChanges).toHaveBeenCalled();
    });

    it('should not delete any attachment when none matches the photo filename', async () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: 'photo.png' };
      attachmentServiceMock.getByUserId.mockReturnValue(
        of({ data: [{ id: 'a1', fileName: 'other.png' } as Attachment] }),
      );
      photoServiceMock.removePhoto.mockReturnValue(of(null));

      // Act
      await removeFlow(component);

      // Assert
      expect(attachmentServiceMock.delete).not.toHaveBeenCalled();
    });

    it('should fall back to an empty attachments array when the response has no data', async () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: 'photo.png' };
      attachmentServiceMock.getByUserId.mockReturnValue(of({}));
      photoServiceMock.removePhoto.mockReturnValue(of(null));

      // Act & Assert
      await expect(removeFlow(component)).resolves.not.toThrow();
      expect(attachmentServiceMock.delete).not.toHaveBeenCalled();
    });

    it('should not attempt to find an attachment when data has no photo', async () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1' };
      photoServiceMock.removePhoto.mockReturnValue(of(null));

      // Act
      await removeFlow(component);

      // Assert
      expect(attachmentServiceMock.getByUserId).not.toHaveBeenCalled();
      expect(photoServiceMock.removePhoto).toHaveBeenCalled();
    });

    it('should show an error notification when the remove request fails', async () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: 'photo.png' };
      attachmentServiceMock.getByUserId.mockReturnValue(of({ data: [] }));
      photoServiceMock.removePhoto.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      await removeFlow(component);

      // Assert
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Erro ao remover foto.',
        'error',
      );
    });

    it.each([
      ['BusinessPartners', 'getByBusinessPartnerId'],
      ['Products', 'getByProductId'],
      ['Orders', 'getByOrderId'],
      ['Transactions', 'getByTransactionId'],
      ['Payments', 'getByPaymentId'],
      ['Vehicles', 'getByVehicleId'],
      ['Drivers', 'getByDriverId'],
    ] as const)('should resolve the fetch function for entityClass %s', async (entityClass, methodName) => {
      // Arrange
      const component = createComponent();
      component.entityClass = entityClass;
      component.data = { id: 'e1', photo: 'photo.png' };
      (attachmentServiceMock as any)[methodName].mockReturnValue(of({ data: [] }));
      photoServiceMock.removePhoto.mockReturnValue(of(null));

      // Act
      await removeFlow(component);

      // Assert
      expect((attachmentServiceMock as any)[methodName]).toHaveBeenCalledWith('e1');
      expect(photoServiceMock.updateUserPhoto).not.toHaveBeenCalled();
    });

    it('should do nothing when the resolved entity id field has no matching fetch function', () => {
      // Every entityClass getEntityIdField() can produce has a matching key in entityMap, so this
      // guard is unreachable via the public API - exercised directly with a stubbed field name.
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';
      component.data = { id: 'u1', photo: 'photo.png' };
      vi.spyOn(component as any, 'getEntityIdField').mockReturnValue('unknownField');

      // Act
      expect(() => (component as any).deletePhotoAttachment()).not.toThrow();

      // Assert
      expect(attachmentServiceMock.getByUserId).not.toHaveBeenCalled();
    });
  });

  describe('getNoImage', () => {
    it('should return the profile placeholder for Users', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Users';

      // Assert
      expect((component as any).getNoImage()).toBe('assets/img/no_profile.png');
    });

    it('should return the generic placeholder for any other entity', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Vehicles';

      // Assert
      expect((component as any).getNoImage()).toBe('assets/img/no_photo_generic.svg');
    });
  });

  describe('getEntityIdField (default fallback)', () => {
    it('should default to userId for an unknown entityClass', () => {
      // Arrange
      const component = createComponent();
      component.entityClass = 'Unknown';
      component.data = { id: 'e1' };
      attachmentServiceMock.add.mockReturnValue(of(null));

      // Act
      (component as any).addPhotoAsAttachment(new File(['x'], 'a.png'));

      // Assert
      expect(attachmentServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'e1' }),
        'photos/Unknown',
      );
    });
  });
});
