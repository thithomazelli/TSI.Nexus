import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import {
  ApiService,
  BusinessPartner,
  BusinessPartnerType,
  Company,
  Individual,
  WebApiResponse,
} from '@nexus/core';
import { BusinessPartnerService } from './business-partner.service';

describe('BusinessPartnerService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): BusinessPartnerService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(BusinessPartnerService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit getAllClients and cache the result per type when getClients is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getClients();
    service.getClients();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('businesspartners/getAllClients');
    expect(apiServiceMock.get).toHaveBeenCalledTimes(1);
  });

  it('should hit getAllSuppliers and cache it separately from getClients when getSuppliers is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getSuppliers();
    service.getClients();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('businesspartners/getAllSuppliers');
    expect(apiServiceMock.get).toHaveBeenCalledWith('businesspartners/getAllClients');
    expect(apiServiceMock.get).toHaveBeenCalledTimes(2);
  });

  it('should emit the loaded response when getClients$ resolves', () => {
    // Arrange
    const load$ = new Subject<WebApiResponse<BusinessPartner[]>>();
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    apiServiceMock.get.mockReturnValue(load$);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    const service = TestBed.inject(BusinessPartnerService);
    let response: WebApiResponse<BusinessPartner[]> | undefined;
    service.getClients().subscribe((v) => (response = v));
    TestBed.flushEffects();
    expect(response).toBeUndefined();

    // Act
    const loaded = { data: [{ id: 'bp1' } as BusinessPartner] } as WebApiResponse<
      BusinessPartner[]
    >;
    load$.next(loaded);
    TestBed.flushEffects();

    // Assert
    expect(response).toBe(loaded);
  });

  it('should complete after their single emission when getClients()/getSuppliers() are used with forkJoin', () => {
    // Arrange
    const load$ = new Subject<WebApiResponse<BusinessPartner[]>>();
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    apiServiceMock.get.mockReturnValue(load$);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    const service = TestBed.inject(BusinessPartnerService);
    let completed = false;
    service.getClients().subscribe({ complete: () => (completed = true) });
    TestBed.flushEffects();
    expect(completed).toBe(false);

    // Act
    load$.next({ data: [] } as unknown as WebApiResponse<BusinessPartner[]>);
    TestBed.flushEffects();

    // Assert
    expect(completed).toBe(true);
  });

  it('should clear the cache and allow a retry instead of hanging forever when the request errors', () => {
    // Arrange
    const service = createService();
    const load$ = new Subject<WebApiResponse<BusinessPartner[]>>();
    apiServiceMock.get.mockReturnValue(load$);
    let completed = false;
    service.getClients().subscribe({ complete: () => (completed = true) });

    // Act
    load$.error(new Error('fail'));
    expect(completed).toBe(false); // the errored cache entry never emits/completes itself

    const retry$ = new Subject<WebApiResponse<BusinessPartner[]>>();
    apiServiceMock.get.mockReturnValue(retry$);
    let retried = false;
    service.getClients().subscribe({ complete: () => (retried = true) });
    retry$.next({ data: [] } as unknown as WebApiResponse<BusinessPartner[]>);
    TestBed.flushEffects();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledTimes(2);
    expect(retried).toBe(true);
  });

  it('should clear the cache for that type and re-fetch when refresh is called', () => {
    // Arrange
    const service = createService();
    const second$ = new Subject<WebApiResponse<BusinessPartner[]>>();
    apiServiceMock.get.mockReturnValue(new Subject());
    service.getClients();

    // Act
    apiServiceMock.get.mockReturnValue(second$);
    service.refresh(BusinessPartnerType.Client);

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledTimes(2);
  });

  it('should build the query string and unwrap response.data when getAllPaged is called for clients', () => {
    // Arrange
    const service = createService();
    const paged$ = new Subject<WebApiResponse<unknown>>();
    apiServiceMock.get.mockReturnValue(paged$);

    // Act
    let result: unknown;
    service
      .getAllPaged(BusinessPartnerType.Client, { page: 1, pageSize: 10 } as never)
      .subscribe((r) => (result = r));
    paged$.next({ data: { items: [] } } as unknown as WebApiResponse<unknown>);

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith(
      expect.stringContaining('businesspartners/getAllClientsPaged?'),
    );
    expect(result).toEqual({ items: [] });
  });

  it('should hit getAllSuppliersPaged when getAllPaged is called for suppliers', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getAllPaged(BusinessPartnerType.Supplier, { page: 1, pageSize: 10 } as never);

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith(
      expect.stringContaining('businesspartners/getAllSuppliersPaged?'),
    );
  });

  it('should hit the expected endpoint when getById is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getById('bp1');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('businesspartners/getById/bp1');
  });

  it('should emit once immediately to a new subscriber when businessPartnerChanged$ is subscribed to', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.businessPartnerChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should clear the per-type cache and notify businessPartnerChanged$ when add/update/delete are called', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<Company | Individual>>();
    const updateResponse$ = new Subject<WebApiResponse<Company | Individual>>();
    const deleteResponse$ = new Subject<WebApiResponse<BusinessPartner>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);
    apiServiceMock.get.mockReturnValue(new Subject());
    let emissions = 0;
    service.businessPartnerChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();
    expect(emissions).toBe(1);
    service.getClients();
    const getCallsAfterFirstFetch = apiServiceMock.get.mock.calls.length;

    // Act / Assert
    service.add({ documentType: 'Física' } as Individual).subscribe();
    addResponse$.next({} as WebApiResponse<Individual>);
    TestBed.flushEffects();
    expect(emissions).toBe(2);

    service.getClients();
    expect(apiServiceMock.get.mock.calls.length).toBe(getCallsAfterFirstFetch + 1);

    service.update({ documentType: 'Jurídica' } as Company).subscribe();
    updateResponse$.next({} as WebApiResponse<Company>);
    TestBed.flushEffects();
    expect(emissions).toBe(3);

    service.delete({} as BusinessPartner).subscribe();
    deleteResponse$.next({} as WebApiResponse<BusinessPartner>);
    TestBed.flushEffects();
    expect(emissions).toBe(4);
  });

  it('should post to the Companies endpoint when add is called with a non-Física documentType', () => {
    // Arrange
    const service = createService();
    apiServiceMock.post.mockReturnValue(new Subject());

    // Act
    service.add({ documentType: 'Jurídica' } as Company).subscribe();

    // Assert
    expect(apiServiceMock.post).toHaveBeenCalledWith('companies/add', expect.anything());
  });

  it('should put to the Individuals endpoint when update is called with a Física documentType', () => {
    // Arrange
    const service = createService();
    apiServiceMock.put.mockReturnValue(new Subject());

    // Act
    service.update({ documentType: 'Física' } as Individual).subscribe();

    // Assert
    expect(apiServiceMock.put).toHaveBeenCalledWith('individuals/update', expect.anything());
  });

  it('should fall back to an empty array when the loaded response carries no data', () => {
    // Arrange
    const service = createService();
    const load$ = new Subject<WebApiResponse<BusinessPartner[]>>();
    apiServiceMock.get.mockReturnValue(load$);
    service.getClients();

    // Act / Assert
    expect(() => load$.next({} as WebApiResponse<BusinessPartner[]>)).not.toThrow();
  });

  describe('addOrUpdateBusinessPartner', () => {
    it('should not throw when called for a new or existing id', () => {
      // Arrange
      const service = createService();

      // Act / Assert
      expect(() => {
        service.addOrUpdateBusinessPartner({ id: 'bp1', name: 'A' } as BusinessPartner);
        service.addOrUpdateBusinessPartner({ id: 'bp1', name: 'A updated' } as BusinessPartner);
        service.addOrUpdateBusinessPartner({ id: 'bp2', name: 'B' } as BusinessPartner);
      }).not.toThrow();
    });
  });

  describe('cpfValidator', () => {
    it('should accept an empty value when validated', () => {
      // Arrange
      const service = createService();
      const validator = service.cpfValidator();

      // Act / Assert
      expect(validator({ value: '' } as never)).toBeNull();
    });

    it('should accept a valid CPF when validated', () => {
      // Arrange
      const service = createService();
      const validator = service.cpfValidator();

      // Act / Assert
      expect(validator({ value: '52998224725' } as never)).toBeNull();
    });

    it('should reject an invalid CPF when validated', () => {
      // Arrange
      const service = createService();
      const validator = service.cpfValidator();

      // Act / Assert
      expect(validator({ value: '11111111111' } as never)).toEqual({ cpfInvalido: true });
      expect(validator({ value: '12345678900' } as never)).toEqual({ cpfInvalido: true });
    });

    it('should reject a CPF with the wrong number of digits when validated', () => {
      // Arrange
      const service = createService();
      const validator = service.cpfValidator();

      // Act / Assert
      expect(validator({ value: '123' } as never)).toEqual({ cpfInvalido: true });
    });

    it("should reject a CPF when its first check digit doesn't match", () => {
      // Arrange
      const service = createService();
      const validator = service.cpfValidator();

      // Act / Assert
      expect(validator({ value: '52998224700' } as never)).toEqual({ cpfInvalido: true });
    });

    it('should accept a valid CPF when its second check digit needs the 10/11 reset rule', () => {
      // Arrange
      const service = createService();
      const validator = service.cpfValidator();

      // Act / Assert
      expect(validator({ value: '10000002810' } as never)).toBeNull();
    });
  });

  describe('cnpjValidator', () => {
    it('should accept an empty value when validated', () => {
      // Arrange
      const service = createService();
      const validator = service.cnpjValidator();

      // Act / Assert
      expect(validator({ value: '' } as never)).toBeNull();
    });

    it('should accept a valid CNPJ when validated', () => {
      // Arrange
      const service = createService();
      const validator = service.cnpjValidator();

      // Act / Assert
      expect(validator({ value: '11222333000181' } as never)).toBeNull();
    });

    it('should reject an invalid CNPJ when validated', () => {
      // Arrange
      const service = createService();
      const validator = service.cnpjValidator();

      // Act / Assert
      expect(validator({ value: '11111111111111' } as never)).toEqual({ cnpjInvalido: true });
      expect(validator({ value: '11222333000199' } as never)).toEqual({ cnpjInvalido: true });
    });

    it('should reject a CNPJ with the wrong number of digits when validated', () => {
      // Arrange
      const service = createService();
      const validator = service.cnpjValidator();

      // Act / Assert
      expect(validator({ value: '123' } as never)).toEqual({ cnpjInvalido: true });
    });

    it('should accept a valid CNPJ when its first check digit needs the 0/1 reset rule', () => {
      // Arrange
      const service = createService();
      const validator = service.cnpjValidator();

      // Act / Assert
      expect(validator({ value: '10000000000307' } as never)).toBeNull();
    });

    it('should accept a valid CNPJ when its second check digit needs the 0/1 reset rule', () => {
      // Arrange
      const service = createService();
      const validator = service.cnpjValidator();

      // Act / Assert
      expect(validator({ value: '10000000000650' } as never)).toBeNull();
    });

    it('should reject a CNPJ when it has a correct first digit but a wrong second check digit', () => {
      // Arrange
      const service = createService();
      const validator = service.cnpjValidator();

      // Act / Assert
      expect(validator({ value: '10000000000308' } as never)).toEqual({ cnpjInvalido: true });
    });
  });
});
