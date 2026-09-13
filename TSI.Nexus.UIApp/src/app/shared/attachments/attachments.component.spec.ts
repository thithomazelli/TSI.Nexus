import { ChangeDetectorRef, ElementRef } from '@angular/core';
import { Attachment, FolderNode, ResponseStatus } from '@nexus/core';
import { of, throwError } from 'rxjs';
import { AttachmentsComponent } from './attachments.component';
import { AttachmentService } from '../../core/services/attachment/attachment.service';
import { ModalService } from '../../core/services/modal/modal.service';
import { NotificationService } from '../../core/services/notification/notification.service';

describe('AttachmentsComponent', () => {
  let attachmentServiceMock: {
    getByBusinessPartnerId: ReturnType<typeof vi.fn>;
    getByOrderId: ReturnType<typeof vi.fn>;
    getByPurchaseOrderId: ReturnType<typeof vi.fn>;
    getByTripId: ReturnType<typeof vi.fn>;
    getByTransactionId: ReturnType<typeof vi.fn>;
    getByPaymentId: ReturnType<typeof vi.fn>;
    getByProductId: ReturnType<typeof vi.fn>;
    getByVehicleId: ReturnType<typeof vi.fn>;
    getByDriverId: ReturnType<typeof vi.fn>;
    getByVehicleMaintenanceId: ReturnType<typeof vi.fn>;
    getByUserId: ReturnType<typeof vi.fn>;
    add: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    downloadFile: ReturnType<typeof vi.fn>;
  };
  let modalServiceMock: {
    showSweetNotification: ReturnType<typeof vi.fn>;
    showSweetConfirmation: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): AttachmentsComponent {
    attachmentServiceMock = {
      getByBusinessPartnerId: vi.fn().mockReturnValue(of({ data: [] })),
      getByOrderId: vi.fn().mockReturnValue(of({ data: [] })),
      getByPurchaseOrderId: vi.fn().mockReturnValue(of({ data: [] })),
      getByTripId: vi.fn().mockReturnValue(of({ data: [] })),
      getByTransactionId: vi.fn().mockReturnValue(of({ data: [] })),
      getByPaymentId: vi.fn().mockReturnValue(of({ data: [] })),
      getByProductId: vi.fn().mockReturnValue(of({ data: [] })),
      getByVehicleId: vi.fn().mockReturnValue(of({ data: [] })),
      getByDriverId: vi.fn().mockReturnValue(of({ data: [] })),
      getByVehicleMaintenanceId: vi.fn().mockReturnValue(of({ data: [] })),
      getByUserId: vi.fn().mockReturnValue(of({ data: [] })),
      add: vi.fn(),
      delete: vi.fn(),
      downloadFile: vi.fn(),
    };
    modalServiceMock = {
      showSweetNotification: vi.fn(),
      showSweetConfirmation: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    cdrMock = { markForCheck: vi.fn() };

    return new AttachmentsComponent(
      attachmentServiceMock as unknown as AttachmentService,
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / loadAttachments', () => {
    it('should do nothing when there is no entityId', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(attachmentServiceMock.getByBusinessPartnerId).not.toHaveBeenCalled();
    });

    it('should fetch attachments and build the tree when the entity is configured', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValue(
        of({
          data: [
            { id: 'a1', path: 'attachments/root-file.pdf', fileName: 'root-file.pdf' },
          ] as Attachment[],
        }),
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(attachmentServiceMock.getByBusinessPartnerId).toHaveBeenCalledWith('bp1');
      expect(component.loading).toBe(false);
      expect(component.attachments).toHaveLength(1);
      expect(component.rootFolder.files).toHaveLength(1);
    });

    it('should stop loading without fetching when the entity is unmapped', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'unknown-entity';
      component.entityId = 'e1';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.loading).toBe(false);
      expect(component.attachments).toEqual([]);
    });

    it('should reset attachments and stop loading when the fetch fails', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValue(
        throwError(() => new Error('fail')),
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(component.attachments).toEqual([]);
      expect(component.loading).toBe(false);
    });

    it('should re-fetch the attachments when refresh() is called', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';

      // Act
      component.refresh();

      // Assert
      expect(attachmentServiceMock.getByBusinessPartnerId).toHaveBeenCalledWith('bp1');
    });
  });

  // getFileIcon()'s `fileName.split('.').pop()?.toLowerCase() ?? ''` fallback, and
  // detect_pathPrefix()'s businessPartner rule `idx >= 0 && parts.length > idx + 1` right-hand
  // check, are both unreachable defensive code: String.split always returns at least one
  // element, so .pop() is never undefined; and the enclosing `att.path.includes('attachments/
  // BusinessPartners/')` guard can only be true when the split has real content after that
  // segment. Left undocumented in production since they're harmless guards, not dead branches
  // worth removing - only noted here as accepted residuals.
  describe('getFileIcon', () => {
    it('should return a generic icon when there is no file name', () => {
      // Act
      const icon = createComponent().getFileIcon();

      // Assert
      expect(icon).toBe('pi pi-file');
    });

    it.each([
      ['photo.png', 'pi pi-image'],
      ['report.pdf', 'pi pi-file-pdf'],
      ['contract.docx', 'pi pi-file-word'],
      ['sheet.xlsx', 'pi pi-file-excel'],
      ['archive.zip', 'pi pi-file'],
    ])('should map %s to %s when getFileIcon is called', (fileName, icon) => {
      // Act
      const result = createComponent().getFileIcon(fileName);

      // Assert
      expect(result).toBe(icon);
    });
  });

  describe('navigation', () => {
    it('should return true from isAtRoot when nothing has been navigated yet', () => {
      // Act
      const isAtRoot = createComponent().isAtRoot();

      // Assert
      expect(isAtRoot).toBe(true);
    });

    it('should fall back to root when navigateToPath is called with an unknown path', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.navigateToPath('does/not/exist');

      // Assert
      expect(component.isAtRoot()).toBe(true);
      expect(component.selectedFile).toBeNull();
    });

    it('should stay at root when navigateUp is called from root', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.navigateUp();

      // Assert
      expect(component.isAtRoot()).toBe(true);
    });
  });

  describe('buildContextMenu', () => {
    it('should hide actions when nothing is selected', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.buildContextMenu();

      // Assert
      expect(component.contextMenuItems.every((item) => item.visible === false)).toBe(true);
    });

    it('should show actions when a file is selected', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.selectFile({ id: 'a1', fileName: 'a.pdf' } as Attachment);

      // Assert
      expect(component.contextMenuItems.every((item) => item.visible === true)).toBe(true);
    });

    it('should open the details dialog when the "Detalhes" command is triggered', () => {
      // Arrange
      const component = createComponent();
      component.selectFile({ id: 'a1', fileName: 'a.pdf' } as Attachment);

      // Act
      component.contextMenuItems[0].command!({} as any);

      // Assert
      expect(component.showDetailsDialog).toBe(true);
    });

    it('should download the selected file when the "Baixar" command is triggered', () => {
      // Arrange
      const component = createComponent();
      component.selectFile({ id: 'a1', fileName: 'a.pdf' } as Attachment);
      attachmentServiceMock.downloadFile.mockReturnValue(of(new Blob(['x'])));
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');

      // Act
      component.contextMenuItems[1].command!({} as any);

      // Assert
      expect(attachmentServiceMock.downloadFile).toHaveBeenCalledWith('a1');
      URL.createObjectURL = originalCreateObjectURL;
    });

    it('should do nothing when the "Baixar" command is triggered without a selected file', () => {
      // Arrange
      const component = createComponent();
      component.buildContextMenu();

      // Act / Assert
      expect(() => component.contextMenuItems[1].command!({} as any)).not.toThrow();
      expect(attachmentServiceMock.downloadFile).not.toHaveBeenCalled();
    });

    it('should open the confirmation dialog when the "Remover" command is triggered', () => {
      // Arrange
      const component = createComponent();
      component.selectFile({ id: 'a1', fileName: 'a.pdf' } as Attachment);
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.contextMenuItems[2].command!({} as any);

      // Assert
      expect(modalServiceMock.showSweetConfirmation).toHaveBeenCalled();
    });
  });

  describe('addAttachment', () => {
    it('should do nothing when there is no selected file', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.addAttachment();

      // Assert
      expect(attachmentServiceMock.add).not.toHaveBeenCalled();
    });

    it('should upload the file and reload when the upload succeeds', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';
      component.addFile = new File(['x'], 'doc.pdf');
      attachmentServiceMock.add.mockReturnValue(
        of({ message: 'Enviado', status: ResponseStatus.Success }),
      );

      // Act
      component.addAttachment();

      // Assert
      expect(attachmentServiceMock.add).toHaveBeenCalled();
      expect(component.showAddDialog).toBe(false);
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Enviado',
        ResponseStatus.Success,
      );
    });

    it('should show an error notification when the upload fails', () => {
      // Arrange
      const component = createComponent();
      component.addFile = new File(['x'], 'doc.pdf');
      attachmentServiceMock.add.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.addAttachment();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'Error',
        'Erro ao adicionar anexo.',
      );
    });
  });

  describe('removeFile', () => {
    it('should do nothing when there is no selected file', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.removeFile();

      // Assert
      expect(modalServiceMock.showSweetConfirmation).not.toHaveBeenCalled();
    });

    it('should delete the selected file when the deletion is confirmed', async () => {
      // Arrange
      const component = createComponent();
      component.selectFile({ id: 'a1', fileName: 'a.pdf' } as Attachment);
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      attachmentServiceMock.delete.mockReturnValue(
        of({ message: 'Removido', status: ResponseStatus.Success }),
      );

      // Act
      component.removeFile();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(attachmentServiceMock.delete).toHaveBeenCalledWith('a1');
      expect(component.selectedFile).toBeNull();
    });

    it('should not delete when the user cancels the confirmation', async () => {
      // Arrange
      const component = createComponent();
      component.selectFile({ id: 'a1', fileName: 'a.pdf' } as Attachment);
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.removeFile();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(attachmentServiceMock.delete).not.toHaveBeenCalled();
    });

    it('should not clear the selection or reload when the delete reports an error status', async () => {
      // Arrange
      const component = createComponent();
      component.selectFile({ id: 'a1', fileName: 'a.pdf' } as Attachment);
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      attachmentServiceMock.delete.mockReturnValue(
        of({ message: 'Falhou', status: ResponseStatus.Error }),
      );

      // Act
      component.removeFile();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(component.selectedFile).not.toBeNull();
    });

    it('should show an error notification when the delete request fails', async () => {
      // Arrange
      const component = createComponent();
      component.selectFile({ id: 'a1', fileName: 'a.pdf' } as Attachment);
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      attachmentServiceMock.delete.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.removeFile();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'Error',
        'Erro ao remover anexo.',
      );
    });
  });

  describe('downloadFile', () => {
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;

    beforeEach(() => {
      URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
      URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('should trigger a download when the request returns a blob', () => {
      // Arrange
      const component = createComponent();
      const blob = new Blob(['content']);
      attachmentServiceMock.downloadFile.mockReturnValue(of(blob));

      // Act
      component.downloadFile({ id: 'a1', fileName: 'a.pdf' } as Attachment);

      // Assert
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    });

    it('should fall back to a generic "download" name when the attachment has no file name', () => {
      // Arrange
      const component = createComponent();
      const blob = new Blob(['content']);
      attachmentServiceMock.downloadFile.mockReturnValue(of(blob));
      let createdAnchor: HTMLAnchorElement | undefined;
      const originalCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = originalCreateElement(tag);
        if (tag === 'a') createdAnchor = el as HTMLAnchorElement;
        return el;
      });

      // Act
      component.downloadFile({ id: 'a1' } as Attachment);

      // Assert
      expect(createdAnchor!.download).toBe('download');
    });

    it('should show an error notification when the download fails', () => {
      // Arrange
      const component = createComponent();
      attachmentServiceMock.downloadFile.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.downloadFile({ id: 'a1', fileName: 'a.pdf' } as Attachment);

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'Error',
        'Erro ao baixar arquivo.',
      );
    });
  });

  describe('addFolder', () => {
    it('should do nothing when the folder name is blank', () => {
      // Arrange
      const component = createComponent();
      component.newFolderName = '   ';

      // Act
      component.addFolder();

      // Assert
      expect(component.rootFolder.children).toHaveLength(0);
    });

    it('should create a new folder when addFolder is called under the current folder', () => {
      // Arrange
      const component = createComponent();
      component.newFolderName = 'Contracts';

      // Act
      component.addFolder();

      // Assert
      expect(component.rootFolder.children.map((c) => c.name)).toContain('Contracts');
      expect(component.showFolderDialog).toBe(false);
    });

    it('should not duplicate an already-existing folder when addFolder is called', () => {
      // Arrange
      const component = createComponent();
      component.rootFolder.children.push({
        name: 'Contracts',
        path: 'Contracts',
        children: [],
        files: [],
      });
      component.newFolderName = 'Contracts';

      // Act
      component.addFolder();

      // Assert
      expect(component.rootFolder.children.filter((c) => c.name === 'Contracts')).toHaveLength(1);
    });

    it('should nest the new folder when addFolder is called under a nested current folder', () => {
      // Arrange
      const component = createComponent();
      const sub: FolderNode = { name: 'Sub', path: 'Sub', children: [], files: [] };
      component.rootFolder.children.push(sub);
      component.currentFolder = sub;
      component.newFolderName = 'Nested';

      // Act
      component.addFolder();

      // Assert
      expect(sub.children.map((c) => c.name)).toContain('Nested');
    });
  });

  describe('loadAttachments (private, via ngOnInit/refresh) - all entity mappings', () => {
    it.each([
      ['order', 'getByOrderId'],
      ['purchaseOrder', 'getByPurchaseOrderId'],
      ['trip', 'getByTripId'],
      ['transaction', 'getByTransactionId'],
      ['payment', 'getByPaymentId'],
      ['product', 'getByProductId'],
      ['vehicle', 'getByVehicleId'],
      ['driver', 'getByDriverId'],
      ['vehicleMaintenance', 'getByVehicleMaintenanceId'],
      ['user', 'getByUserId'],
    ] as const)('should fetch via %s -> %s when ngOnInit is called', (entity, method) => {
      // Arrange
      const component = createComponent();
      component.entity = entity;
      component.entityId = 'e1';

      // Act
      component.ngOnInit();

      // Assert
      expect((attachmentServiceMock as any)[method]).toHaveBeenCalledWith('e1');
    });

    it('should fall back to an empty attachments array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.attachments).toEqual([]);
    });

    it('should re-navigate to the current folder path when the reload succeeds after loading', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValue(
        of({
          data: [
            { id: 'a1', path: 'attachments/BusinessPartners/Cliente/Transactions/x/f.pdf' },
          ] as Attachment[],
        }),
      );
      component.ngOnInit();
      const target = component.rootFolder.children.find((c) => c.name === 'Transactions')!;
      component.currentFolder = target;

      // Act
      component.refresh();

      // Assert
      expect(component.currentFolder.name).toBe('Transactions');
    });

    it('should re-navigate to the current folder path when the reload results in an error', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValueOnce(
        of({
          data: [
            { id: 'a1', path: 'attachments/BusinessPartners/Cliente/Transactions/x/f.pdf' },
          ] as Attachment[],
        }),
      );
      component.ngOnInit();
      const target = component.rootFolder.children.find((c) => c.name === 'Transactions')!;
      component.currentFolder = target;
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValueOnce(
        throwError(() => new Error('fail')),
      );

      // Act
      component.refresh();

      // Assert
      expect(component.isAtRoot()).toBe(true);
    });
  });

  describe('entityIdField / entityFolderKey (private, via addAttachment/detect_pathPrefix)', () => {
    it.each([
      ['businessPartner', 'businessPartnerId'],
      ['order', 'orderId'],
      ['purchaseOrder', 'purchaseOrderId'],
      ['transaction', 'transactionId'],
      ['payment', 'paymentId'],
      ['product', 'productId'],
      ['vehicle', 'vehicleId'],
      ['driver', 'driverId'],
      ['vehicleMaintenance', 'vehicleMaintenanceId'],
      ['user', 'userId'],
    ] as const)('should tag the payload with %s -> %s when addAttachment is called', (entity, field) => {
      // Arrange
      const component = createComponent();
      component.entity = entity;
      component.entityId = 'e1';
      component.addFile = new File(['x'], 'doc.pdf');
      attachmentServiceMock.add.mockReturnValue(
        of({ message: 'OK', status: ResponseStatus.Success }),
      );

      // Act
      component.addAttachment();

      // Assert
      expect(attachmentServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ [field]: 'e1' }),
        undefined,
      );
    });

    it('should fall back to businessPartnerId when the entity is unmapped', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'somethingElse';
      component.entityId = 'e1';
      component.addFile = new File(['x'], 'doc.pdf');
      attachmentServiceMock.add.mockReturnValue(
        of({ message: 'OK', status: ResponseStatus.Success }),
      );

      // Act
      component.addAttachment();

      // Assert
      expect(attachmentServiceMock.add).toHaveBeenCalledWith(
        expect.objectContaining({ businessPartnerId: 'e1' }),
        undefined,
      );
    });

    it('should not reload when the upload response is not a success status', () => {
      // Arrange
      const component = createComponent();
      component.addFile = new File(['x'], 'doc.pdf');
      attachmentServiceMock.add.mockReturnValue(
        of({ message: 'Falhou', status: ResponseStatus.Error }),
      );

      // Act
      component.addAttachment();

      // Assert
      expect(attachmentServiceMock.getByBusinessPartnerId).not.toHaveBeenCalled();
    });

    it('should pass the addPath override when it is set', () => {
      // Arrange
      const component = createComponent();
      component.addFile = new File(['x'], 'doc.pdf');
      component.addPath = 'Custom/Path';
      attachmentServiceMock.add.mockReturnValue(
        of({ message: 'OK', status: ResponseStatus.Success }),
      );

      // Act
      component.addAttachment();

      // Assert
      expect(attachmentServiceMock.add).toHaveBeenCalledWith(expect.anything(), 'Custom/Path');
    });
  });

  describe('getFullPath', () => {
    it('should return the relative path unchanged when there is no prefix', () => {
      // Arrange
      const component = createComponent();

      // Act
      const result = component.getFullPath('Sub/Folder');

      // Assert
      expect(result).toBe('Sub/Folder');
    });

    it('should join the stripped prefix with the relative path when getFullPath is called', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValue(
        of({ data: [{ id: 'a1', path: 'attachments/BusinessPartners/Cliente/f.pdf' }] as Attachment[] }),
      );
      component.ngOnInit();

      // Act
      const result = component.getFullPath('Sub');

      // Assert
      expect(result).toBe('BusinessPartners/Cliente/Sub');
    });

    it('should return just the prefix when the relative path is empty', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValue(
        of({ data: [{ id: 'a1', path: 'attachments/BusinessPartners/Cliente/f.pdf' }] as Attachment[] }),
      );
      component.ngOnInit();

      // Act
      const result = component.getFullPath('');

      // Assert
      expect(result).toBe('BusinessPartners/Cliente');
    });

    it('should return the relative path unchanged when the prefix is just "attachments"', () => {
      // Arrange
      const component = createComponent();
      (component as any)._pathPrefix = 'attachments';

      // Act
      const result = component.getFullPath('Sub');

      // Assert
      expect(result).toBe('Sub');
    });
  });

  describe('entityFolderKey / detect_pathPrefix edge branches (private)', () => {
    it('should fall back to an empty string when the entity is unmapped', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'somethingElse';

      // Act
      const result = (component as any).entityFolderKey;

      // Assert
      expect(result).toBe('');
    });

    it('should fall through when the purchaseOrder path has no match', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'purchaseOrder';
      component.entityId = 'bp1';
      component.purchaseOrderNumber = 'PO-1';
      (component as any).attachments = [
        { id: 'a1', path: 'attachments/PurchaseOrders/OTHER/nota.pdf' },
      ];

      // Act
      const { prefix } = (component as any).detect_pathPrefix();

      // Assert
      expect(prefix).not.toContain('/PurchaseOrders/PO-1');
    });

    it('should fall through when the trip path has no match', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'trip';
      component.entityId = 'bp1';
      component.tripNumber = 'TRIP-1';
      (component as any).attachments = [
        { id: 'a1', path: 'attachments/Trips/OTHER/rota.pdf' },
      ];

      // Act
      const { prefix } = (component as any).detect_pathPrefix();

      // Assert
      expect(prefix).not.toContain('/Trips/TRIP-1');
    });

    it('should fall through when the transaction path has no match', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'transaction';
      component.entityId = 'tx1';
      (component as any).attachments = [
        { id: 'a1', path: 'attachments/Transactions/other-tx/recibo.pdf' },
      ];

      // Act
      const { prefix } = (component as any).detect_pathPrefix();

      // Assert
      expect(prefix).not.toContain('/Transactions/tx1');
    });

    it('should fall through when the vehicleMaintenance path has no match', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'vehicleMaintenance';
      component.entityId = 'vm1';
      (component as any).attachments = [
        { id: 'a1', path: 'attachments/Vehicles/ABC-1234/Maintenances/other-vm/nota.pdf' },
      ];

      // Act
      const { prefix } = (component as any).detect_pathPrefix();

      // Assert
      expect(prefix).not.toContain('/Maintenances/vm1');
    });

    it('should skip generic entityFolderKey detection when the entity is unmapped', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'somethingElse';
      (component as any).attachments = [{ id: 'a1', path: 'attachments/loose-file.pdf' }];

      // Act
      const { prefix, rootName } = (component as any).detect_pathPrefix();

      // Assert
      expect(prefix).toBe('');
      expect(rootName).toBe('Anexos');
    });

    it('should skip the purchaseOrder-specific rule when purchaseOrderNumber is missing', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'purchaseOrder';
      component.entityId = 'bp1';
      component.purchaseOrderNumber = '';
      (component as any).attachments = [
        { id: 'a1', path: 'attachments/BusinessPartners/Fornecedor/PurchaseOrders/PO-1/nota.pdf' },
      ];

      // Act
      const { prefix } = (component as any).detect_pathPrefix();

      // Assert
      expect(prefix).not.toContain('/PurchaseOrders/PO-1');
    });

    it('should skip the trip-specific rule when tripNumber is missing', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'trip';
      component.entityId = 'bp1';
      component.tripNumber = '';
      (component as any).attachments = [
        { id: 'a1', path: 'attachments/BusinessPartners/Cliente/Trips/TRIP-1/rota.pdf' },
      ];

      // Act
      const { prefix } = (component as any).detect_pathPrefix();

      // Assert
      expect(prefix).not.toContain('/Trips/TRIP-1');
    });

    it('should skip the transaction-specific rule when entityId is missing', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'transaction';
      component.entityId = '';
      (component as any).attachments = [
        { id: 'a1', path: 'attachments/BusinessPartners/Cliente/Transactions/tx1/recibo.pdf' },
      ];

      // Act
      const { prefix } = (component as any).detect_pathPrefix();

      // Assert
      expect(prefix).not.toContain('/Transactions/tx1');
    });

    it('should skip the vehicleMaintenance-specific rule when entityId is missing', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'vehicleMaintenance';
      component.entityId = '';
      (component as any).attachments = [
        { id: 'a1', path: 'attachments/Vehicles/ABC-1234/Maintenances/vm1/nota.pdf' },
      ];

      // Act
      const { prefix } = (component as any).detect_pathPrefix();

      // Assert
      expect(prefix).not.toContain('/Maintenances/vm1');
    });
  });

  describe('openAddDialog', () => {
    it('should reset state, compute addPath, and clear the file input when openAddDialog is called', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      const nativeInput = { value: 'stale.pdf' } as HTMLInputElement;
      component.fileInput = { nativeElement: nativeInput } as ElementRef<HTMLInputElement>;
      component.addFile = new File(['x'], 'previous.pdf');

      // Act
      component.openAddDialog();
      vi.runAllTimers();

      // Assert
      expect(component.addFile).toBeNull();
      expect(component.showAddDialog).toBe(true);
      expect(nativeInput.value).toBe('');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should not throw when there is no fileInput yet', () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();

      // Act
      component.openAddDialog();

      // Assert
      expect(() => vi.runAllTimers()).not.toThrow();
      vi.useRealTimers();
    });
  });

  describe('onAddFileSelected', () => {
    it('should set addFile when the input event has a file', () => {
      // Arrange
      const component = createComponent();
      const file = new File(['x'], 'doc.pdf');
      const input = { files: [file] } as unknown as HTMLInputElement;

      // Act
      component.onAddFileSelected({ target: input } as unknown as Event);

      // Assert
      expect(component.addFile).toBe(file);
    });

    it('should do nothing when there are no files', () => {
      // Arrange
      const component = createComponent();
      const input = { files: null } as unknown as HTMLInputElement;

      // Act
      component.onAddFileSelected({ target: input } as unknown as Event);

      // Assert
      expect(component.addFile).toBeNull();
    });

    it('should do nothing when the file list is empty', () => {
      // Arrange
      const component = createComponent();
      const input = { files: [] as unknown as FileList } as unknown as HTMLInputElement;

      // Act
      component.onAddFileSelected({ target: input } as unknown as Event);

      // Assert
      expect(component.addFile).toBeNull();
    });
  });

  describe('openFolderDialog / openDetailsDialog', () => {
    it('should reset the new folder name and open the dialog when openFolderDialog is called', () => {
      // Arrange
      const component = createComponent();
      component.newFolderName = 'stale';

      // Act
      component.openFolderDialog();

      // Assert
      expect(component.newFolderName).toBe('');
      expect(component.showFolderDialog).toBe(true);
    });

    it('should do nothing when there is no selected file', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.openDetailsDialog();

      // Assert
      expect(component.showDetailsDialog).toBe(false);
    });

    it('should open the details dialog when a file is selected', () => {
      // Arrange
      const component = createComponent();
      component.selectFile({ id: 'a1' } as Attachment);

      // Act
      component.openDetailsDialog();

      // Assert
      expect(component.showDetailsDialog).toBe(true);
    });
  });

  describe('onFileContextMenu', () => {
    it('should select the file and rebuild the context menu when onFileContextMenu is called', () => {
      // Arrange
      const component = createComponent();
      const file = { id: 'a1' } as Attachment;

      // Act
      component.onFileContextMenu({} as MouseEvent, file);

      // Assert
      expect(component.selectedFile).toBe(file);
      expect(component.contextMenuItems.every((item) => item.visible === true)).toBe(true);
    });
  });

  describe('drag & drop', () => {
    function dragEvent(overrides: Partial<DragEvent> = {}): DragEvent {
      return {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        ...overrides,
      } as unknown as DragEvent;
    }

    it('should set isDraggingOver when onDragOver is called', () => {
      // Arrange
      const component = createComponent();
      const event = dragEvent();

      // Act
      component.onDragOver(event);

      // Assert
      expect(component.isDraggingOver).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should reset state when onDragLeave is called leaving the container entirely', () => {
      // Arrange
      const component = createComponent();
      component.isDraggingOver = true;
      component.dragOverFolder = { name: 'X', path: 'X', children: [], files: [] };
      const container = { contains: vi.fn().mockReturnValue(false) };
      const event = dragEvent({ currentTarget: container as any, relatedTarget: {} as any });

      // Act
      component.onDragLeave(event);

      // Assert
      expect(component.isDraggingOver).toBe(false);
      expect(component.dragOverFolder).toBeNull();
    });

    it('should keep state when onDragLeave is called moving into a child element', () => {
      // Arrange
      const component = createComponent();
      component.isDraggingOver = true;
      const container = { contains: vi.fn().mockReturnValue(true) };
      const event = dragEvent({ currentTarget: container as any, relatedTarget: {} as any });

      // Act
      component.onDragLeave(event);

      // Assert
      expect(component.isDraggingOver).toBe(true);
    });

    it('should track the hovered folder when onFolderDragOver is called', () => {
      // Arrange
      const component = createComponent();
      const folder = { name: 'X', path: 'X', children: [], files: [] };

      // Act
      component.onFolderDragOver(dragEvent(), folder);

      // Assert
      expect(component.dragOverFolder).toBe(folder);
    });

    it('should clear the hovered folder when onFolderDragLeave is called', () => {
      // Arrange
      const component = createComponent();
      component.dragOverFolder = { name: 'X', path: 'X', children: [], files: [] };

      // Act
      component.onFolderDragLeave(dragEvent());

      // Assert
      expect(component.dragOverFolder).toBeNull();
    });

    it('should upload the first dropped file when onDropOnFolder is called', () => {
      // Arrange
      const component = createComponent();
      component.isDraggingOver = true;
      component.dragOverFolder = { name: 'X', path: 'X', children: [], files: [] };
      const file = new File(['x'], 'dropped.pdf');
      attachmentServiceMock.add.mockReturnValue(
        of({ message: 'OK', status: ResponseStatus.Success }),
      );

      // Act
      component.onDropOnFolder(
        dragEvent({ dataTransfer: { files: [file] } as unknown as DataTransfer }),
        { name: 'X', path: 'X', children: [], files: [] },
      );

      // Assert
      expect(attachmentServiceMock.add).toHaveBeenCalled();
      expect(component.isDraggingOver).toBe(false);
      expect(component.dragOverFolder).toBeNull();
    });

    it('should do nothing when onDropOnFolder is called without dropped files', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onDropOnFolder(
        dragEvent({ dataTransfer: { files: [] as unknown as FileList } as unknown as DataTransfer }),
        { name: 'X', path: 'X', children: [], files: [] },
      );

      // Assert
      expect(attachmentServiceMock.add).not.toHaveBeenCalled();
    });

    it('should do nothing when onDropOnFolder is called without dataTransfer', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onDropOnFolder(dragEvent(), { name: 'X', path: 'X', children: [], files: [] });

      // Assert
      expect(attachmentServiceMock.add).not.toHaveBeenCalled();
    });

    it('should upload to the current folder path when onDropOnContainer is called', () => {
      // Arrange
      const component = createComponent();
      const file = new File(['x'], 'dropped.pdf');
      attachmentServiceMock.add.mockReturnValue(
        of({ message: 'OK', status: ResponseStatus.Success }),
      );

      // Act
      component.onDropOnContainer(
        dragEvent({ dataTransfer: { files: [file] } as unknown as DataTransfer }),
      );

      // Assert
      expect(attachmentServiceMock.add).toHaveBeenCalled();
    });

    it('should not reload when the dropped upload reports a non-success status', () => {
      // Arrange
      const component = createComponent();
      const file = new File(['x'], 'dropped.pdf');
      attachmentServiceMock.add.mockReturnValue(
        of({ message: 'Falhou', status: ResponseStatus.Error }),
      );

      // Act
      component.onDropOnContainer(
        dragEvent({ dataTransfer: { files: [file] } as unknown as DataTransfer }),
      );

      // Assert
      expect(attachmentServiceMock.getByBusinessPartnerId).not.toHaveBeenCalled();
    });

    it('should do nothing when onDropOnContainer is called without dropped files', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onDropOnContainer(dragEvent());

      // Assert
      expect(attachmentServiceMock.add).not.toHaveBeenCalled();
    });

    it('should show an error notification when the dropped upload fails', () => {
      // Arrange
      const component = createComponent();
      const file = new File(['x'], 'dropped.pdf');
      attachmentServiceMock.add.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.onDropOnContainer(
        dragEvent({ dataTransfer: { files: [file] } as unknown as DataTransfer }),
      );

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'Error',
        'Erro ao adicionar anexo.',
      );
    });
  });

  describe('detect_pathPrefix / buildTree (private, via ngOnInit)', () => {
    function load(component: AttachmentsComponent, attachments: Partial<Attachment>[]) {
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValue(of({ data: attachments }));
      attachmentServiceMock.getByOrderId.mockReturnValue(of({ data: attachments }));
      attachmentServiceMock.getByPurchaseOrderId.mockReturnValue(of({ data: attachments }));
      attachmentServiceMock.getByTripId.mockReturnValue(of({ data: attachments }));
      attachmentServiceMock.getByTransactionId.mockReturnValue(of({ data: attachments }));
      attachmentServiceMock.getByVehicleMaintenanceId.mockReturnValue(of({ data: attachments }));
      component.ngOnInit();
    }

    it('should detect the Orders prefix and nest unrelated files at the root when the entity is order', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'order';
      component.entityId = 'bp1';
      component.orderNumber = 'ORD-1';

      // Act
      load(component, [
        { id: 'a1', path: 'attachments/BusinessPartners/Cliente/Orders/ORD-1/nota.pdf' },
      ]);

      // Assert
      expect(component.rootFolder.files.map((f) => f.id)).toContain('a1');
      expect(component.rootFolder.children).toHaveLength(0);
    });

    it('should fall through to generic detection when the order path has no match', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'order';
      component.entityId = 'bp1';
      component.orderNumber = 'ORD-1';

      // Act
      load(component, [{ id: 'a1', path: 'attachments/Orders/OTHER/nota.pdf' }]);

      // Assert
      expect(component.rootFolder.files.map((f) => f.id)).toContain('a1');
    });

    it('should detect the PurchaseOrders prefix when the entity is purchaseOrder', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'purchaseOrder';
      component.entityId = 'bp1';
      component.purchaseOrderNumber = 'PO-1';

      // Act
      load(component, [
        { id: 'a1', path: 'attachments/BusinessPartners/Fornecedor/PurchaseOrders/PO-1/nota.pdf' },
      ]);

      // Assert
      expect(component.rootFolder.files.map((f) => f.id)).toContain('a1');
    });

    it('should detect the Trips prefix when the entity is trip', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'trip';
      component.entityId = 'bp1';
      component.tripNumber = 'TRIP-1';

      // Act
      load(component, [
        { id: 'a1', path: 'attachments/BusinessPartners/Cliente/Trips/TRIP-1/rota.pdf' },
      ]);

      // Assert
      expect(component.rootFolder.files.map((f) => f.id)).toContain('a1');
    });

    it('should detect the Transactions prefix when the entity is transaction', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'transaction';
      component.entityId = 'tx1';

      // Act
      load(component, [
        { id: 'a1', path: 'attachments/BusinessPartners/Cliente/Transactions/tx1/recibo.pdf' },
      ]);

      // Assert
      expect(component.rootFolder.files.map((f) => f.id)).toContain('a1');
    });

    it('should detect the Maintenances prefix when the entity is vehicleMaintenance', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'vehicleMaintenance';
      component.entityId = 'vm1';

      // Act
      load(component, [
        { id: 'a1', path: 'attachments/Vehicles/ABC-1234/Maintenances/vm1/nota.pdf' },
      ]);

      // Assert
      expect(component.rootFolder.files.map((f) => f.id)).toContain('a1');
    });

    it('should detect the BusinessPartners prefix when the entity is businessPartner', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';

      // Act
      load(component, [
        { id: 'a1', path: 'attachments/BusinessPartners/Cliente/contrato.pdf' },
      ]);

      // Assert
      expect((component as any)._pathPrefix).toBe('attachments/BusinessPartners/Cliente');
    });

    it('should fall back to entityFolderKey detection when the entity is generic and the id matches', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'vehicle';
      component.entityId = 'v1';
      attachmentServiceMock.getByVehicleId.mockReturnValue(
        of({ data: [{ id: 'a1', path: 'attachments/Vehicles/v1/doc.pdf' }] }),
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(component.rootFolder.files.map((f) => f.id)).toContain('a1');
    });

    it('should fall back to the generic relatedEntities scan when nothing else matches', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'driver';
      component.entityId = 'other-id';
      attachmentServiceMock.getByDriverId.mockReturnValue(
        of({ data: [{ id: 'a1', path: 'attachments/Drivers/some-other-id/doc.pdf' }] }),
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(component.rootFolder.name).toBe('Drivers');
    });

    it('should default to an empty prefix and "Anexos" root when nothing matches at all', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValue(
        of({ data: [{ id: 'a1', path: 'random/unrelated/doc.pdf' }] }),
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(component.rootFolder.name).toBe('Anexos');
      expect(component.rootFolder.files.map((f) => f.id)).toContain('a1');
    });

    it('should treat a missing attachment path as an empty string when building the tree', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValue(
        of({ data: [{ id: 'a1' }] }),
      );

      // Act / Assert
      expect(() => component.ngOnInit()).not.toThrow();
      expect(component.rootFolder.files.map((f) => f.id)).toContain('a1');
    });

    it('should strip a leading "attachments" segment when there is no matched prefix', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValue(
        of({ data: [{ id: 'a1', path: 'attachments/loose-file.pdf' }] }),
      );

      // Act
      component.ngOnInit();

      // Assert
      expect(component.rootFolder.files.map((f) => f.id)).toContain('a1');
    });

    it('should nest Orders as a related entity when outside the order context', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValue(
        of({
          data: [
            { id: 'a1', path: 'attachments/BusinessPartners/Cliente/Orders/ORD-9/nota.pdf' },
          ],
        }),
      );

      // Act
      component.ngOnInit();

      // Assert
      const ordersFolder = component.rootFolder.children.find((c) => c.name === 'Orders');
      expect(ordersFolder).toBeTruthy();
    });

    it('should reuse an existing child folder when a duplicate folder name would otherwise be created', () => {
      // Each Attachment.path includes the filename as its final segment (the backend combines
      // the containing folder with the sanitized file name into Path - see
      // AttachmentService.cs's `Path.Combine(path, fileName)`), so two attachments only ever
      // share a common *intermediate* folder (here, "Orders" itself) rather than their full
      // path - this is what exercises the "reuse an existing child" branch in buildTree().
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValue(
        of({
          data: [
            { id: 'a1', path: 'attachments/BusinessPartners/Cliente/Orders/ORD-9/nota1.pdf' },
            { id: 'a2', path: 'attachments/BusinessPartners/Cliente/Orders/ORD-10/nota2.pdf' },
          ],
        }),
      );

      // Act
      component.ngOnInit();

      // Assert
      const ordersFolders = component.rootFolder.children.filter((c) => c.name === 'Orders');
      expect(ordersFolders).toHaveLength(1);
      expect(ordersFolders[0].children.map((c) => c.name)).toEqual(['ORD-9', 'ORD-10']);
    });
  });

  describe('findFolder (private, via navigateToPath)', () => {
    it('should navigate into a nested folder when navigateToPath is called', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValue(
        of({
          data: [
            { id: 'a1', path: 'attachments/BusinessPartners/Cliente/Orders/ORD-1/nota.pdf' },
          ],
        }),
      );
      component.ngOnInit();

      // Act
      component.navigateToPath('Orders/ORD-1');

      // Assert
      expect(component.currentFolder.name).toBe('ORD-1');
      expect(component.breadcrumbs.map((b) => b.label)).toEqual(['Anexos', 'Orders', 'ORD-1']);
    });

    it('should move back to the parent folder when navigateUp is called', () => {
      // Arrange
      const component = createComponent();
      component.entity = 'businessPartner';
      component.entityId = 'bp1';
      attachmentServiceMock.getByBusinessPartnerId.mockReturnValue(
        of({
          data: [
            { id: 'a1', path: 'attachments/BusinessPartners/Cliente/Orders/ORD-1/nota.pdf' },
          ],
        }),
      );
      component.ngOnInit();
      component.navigateToPath('Orders/ORD-1');

      // Act
      component.navigateUp();

      // Assert
      expect(component.currentFolder.name).toBe('Orders');
    });
  });
});
