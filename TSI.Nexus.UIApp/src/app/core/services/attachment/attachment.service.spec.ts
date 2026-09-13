import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { Attachment, ApiService, WebApiResponse } from '@nexus/core';
import { AttachmentService } from './attachment.service';

describe('AttachmentService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getBlob: ReturnType<typeof vi.fn>;
  };

  function createService(): AttachmentService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), getBlob: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(AttachmentService);
  }

  it('should create the service when instantiated', () => {
    // Act
    // Assert
    expect(createService()).toBeTruthy();
  });

  it('should hit the expected endpoint when getById or any getByXId method is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getById('a1');
    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('attachments/getById/a1');

    service.getByBusinessPartnerId('bp1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('attachments/getByBusinessPartnerId/bp1');

    service.getByOrderId('o1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('attachments/getByOrderId/o1');

    service.getByPurchaseOrderId('po1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('attachments/getByPurchaseOrderId/po1');

    service.getByTripId('t1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('attachments/getByTripId/t1');

    service.getByTransactionId('tr1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('attachments/getByTransactionId/tr1');

    service.getByPaymentId('pay1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('attachments/getByPaymentId/pay1');

    service.getByProductId('p1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('attachments/getByProductId/p1');

    service.getByVehicleId('v1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('attachments/getByVehicleId/v1');

    service.getByDriverId('d1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('attachments/getByDriverId/d1');

    service.getByVehicleMaintenanceId('vm1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('attachments/getByVehicleMaintenanceId/vm1');

    service.getByUserId('u1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('attachments/getByUserId/u1');
  });

  it('should fetch a blob from the expected endpoint when downloadFile is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.getBlob.mockReturnValue(new Subject());

    // Act
    service.downloadFile('a1');

    // Assert
    expect(apiServiceMock.getBlob).toHaveBeenCalledWith('attachments/getFileById/a1');
  });

  it('should emit once immediately when a new subscriber subscribes to attachmentChanged$', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.attachmentChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should build a FormData payload including an override path and notify attachmentChanged$ when add succeeds', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<Attachment>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    let emissions = 0;
    service.attachmentChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Act
    service.add({ id: 'a1', file: new File(['x'], 'a.pdf') } as Attachment, 'custom/path').subscribe();

    // Assert
    expect(apiServiceMock.post).toHaveBeenCalledWith('attachments/add', expect.any(FormData));
    const formData = apiServiceMock.post.mock.calls[0][1] as FormData;
    expect(formData.get('id')).toBe('a1');
    expect(formData.get('overridePath')).toBe('custom/path');

    addResponse$.next({} as WebApiResponse<Attachment>);
    TestBed.flushEffects();
    expect(emissions).toBe(2);
  });

  it('should notify attachmentChanged$ when update or delete succeeds', () => {
    // Arrange
    const service = createService();
    const updateResponse$ = new Subject<WebApiResponse<Attachment>>();
    const deleteResponse$ = new Subject<WebApiResponse<Attachment>>();
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);
    let emissions = 0;
    service.attachmentChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Act
    service.update({ id: 'a1' } as Attachment).subscribe();
    updateResponse$.next({} as WebApiResponse<Attachment>);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(2);

    service.delete('a1').subscribe();
    expect(apiServiceMock.delete).toHaveBeenCalledWith('attachments/delete/a1', null);
    deleteResponse$.next({} as WebApiResponse<Attachment>);
    TestBed.flushEffects();
    expect(emissions).toBe(3);
  });

  it('should include the override path in the FormData when update is called with one', () => {
    // Arrange
    const service = createService();
    apiServiceMock.put.mockReturnValue(new Subject());

    // Act
    service.update({ id: 'a1' } as Attachment, 'custom/path').subscribe();

    // Assert
    const formData = apiServiceMock.put.mock.calls[0][1] as FormData;
    expect(formData.get('overridePath')).toBe('custom/path');
  });

  it('should include every optional attachment field in the FormData when add is called with all fields present', () => {
    // Arrange
    const service = createService();
    apiServiceMock.post.mockReturnValue(new Subject());

    // Act
    service
      .add({
        id: 'a1',
        file: new File(['x'], 'a.pdf'),
        businessPartnerId: 'bp1',
        orderId: 'o1',
        purchaseOrderId: 'po1',
        tripId: 't1',
        transactionId: 'tr1',
        paymentId: 'pay1',
        productId: 'p1',
        vehicleId: 'v1',
        driverId: 'd1',
        vehicleMaintenanceId: 'vm1',
        userId: 'u1',
      } as Attachment)
      .subscribe();

    // Assert
    const formData = apiServiceMock.post.mock.calls[0][1] as FormData;
    expect(formData.get('businessPartnerId')).toBe('bp1');
    expect(formData.get('orderId')).toBe('o1');
    expect(formData.get('purchaseOrderId')).toBe('po1');
    expect(formData.get('tripId')).toBe('t1');
    expect(formData.get('transactionId')).toBe('tr1');
    expect(formData.get('paymentId')).toBe('pay1');
    expect(formData.get('productId')).toBe('p1');
    expect(formData.get('vehicleId')).toBe('v1');
    expect(formData.get('driverId')).toBe('d1');
    expect(formData.get('vehicleMaintenanceId')).toBe('vm1');
    expect(formData.get('userId')).toBe('u1');
  });

  it('should omit every optional field from the FormData when add is called without them', () => {
    // Arrange
    const service = createService();
    apiServiceMock.post.mockReturnValue(new Subject());

    // Act
    service.add({} as Attachment).subscribe();

    // Assert
    const formData = apiServiceMock.post.mock.calls[0][1] as FormData;
    expect(formData.get('id')).toBeNull();
    expect(formData.get('file')).toBeNull();
    expect(formData.get('businessPartnerId')).toBeNull();
  });
});
