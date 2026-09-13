import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, Driver, ResponseStatus, WebApiResponse } from '@nexus/core';
import { DriverService } from './driver.service';

describe('DriverService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): DriverService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    apiServiceMock.get.mockReturnValue(new Subject());
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(DriverService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should trigger a getAll fetch eagerly on construction', () => {
    // Act
    createService();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('drivers/getAll');
  });

  it('should emit the loaded response on drivers$/getAll() once the request resolves', () => {
    // Arrange
    const load$ = new Subject<WebApiResponse<Driver[]>>();
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    apiServiceMock.get.mockReturnValue(load$);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    const service = TestBed.inject(DriverService);
    let response: WebApiResponse<Driver[]> | undefined;
    service.getAll().subscribe((v) => (response = v));
    TestBed.flushEffects();
    expect(response).toBeUndefined();

    // Act
    const loaded = { data: [{ id: 'd1' } as Driver] } as WebApiResponse<Driver[]>;
    load$.next(loaded);
    TestBed.flushEffects();

    // Assert
    expect(response).toBe(loaded);
  });

  it('should emit an empty fallback response on drivers$ instead of hanging forever when the initial load fails', () => {
    // Arrange
    const load$ = new Subject<WebApiResponse<Driver[]>>();
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    apiServiceMock.get.mockReturnValue(load$);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    const service = TestBed.inject(DriverService);
    let response: WebApiResponse<Driver[]> | undefined;
    service.getAll().subscribe((v) => (response = v));
    TestBed.flushEffects();

    // Act
    load$.error(new Error('fail'));
    TestBed.flushEffects();

    // Assert
    expect(response).toEqual({ data: [], message: '', status: ResponseStatus.Error });
  });

  it('should build the query string and unwrap response.data when getAllPaged is called', () => {
    // Arrange
    const service = createService();
    const paged$ = new Subject<WebApiResponse<unknown>>();
    apiServiceMock.get.mockReturnValue(paged$);

    // Act
    let result: unknown;
    service.getAllPaged({ page: 1, pageSize: 10 } as never).subscribe((r) => (result = r));
    const pagedResult = { items: [], totalCount: 0 };
    paged$.next({ data: pagedResult } as WebApiResponse<unknown>);

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith(
      expect.stringContaining('drivers/getAllPaged?'),
    );
    expect(result).toBe(pagedResult);
  });

  it('should hit the expected endpoint when getById is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getById('d1');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('drivers/getById/d1');
  });

  it('should hit the expected endpoint when getActive is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getActive();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('drivers/getActive');
  });

  describe('getExpiringLicenses', () => {
    it('should omit the query string when daysAhead is not provided', () => {
      // Arrange
      const service = createService();
      apiServiceMock.get.mockReturnValue(new Subject());

      // Act
      service.getExpiringLicenses();

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledWith('drivers/getExpiringLicenses');
    });

    it('should append daysAhead when provided', () => {
      // Arrange
      const service = createService();
      apiServiceMock.get.mockReturnValue(new Subject());

      // Act
      service.getExpiringLicenses(30);

      // Assert
      expect(apiServiceMock.get).toHaveBeenCalledWith('drivers/getExpiringLicenses?daysAhead=30');
    });
  });

  it('should re-fetch directly and also invalidate the shared drivers$ cache when refresh is called', () => {
    // Arrange
    const service = createService();
    const refreshResponse$ = new Subject<WebApiResponse<Driver[]>>();
    apiServiceMock.get.mockReturnValue(refreshResponse$);

    // Act
    let refreshResult: WebApiResponse<Driver[]> | undefined;
    service.refresh().subscribe((v) => (refreshResult = v));
    const getCallsBefore = apiServiceMock.get.mock.calls.length;
    const reload$ = new Subject<WebApiResponse<Driver[]>>();
    apiServiceMock.get.mockReturnValue(reload$);
    const refreshed = { data: [{ id: 'd2' } as Driver] } as WebApiResponse<Driver[]>;
    refreshResponse$.next(refreshed);

    // Assert
    expect(refreshResult).toBe(refreshed);
    expect(apiServiceMock.get.mock.calls.length).toBe(getCallsBefore + 1);
  });

  it('should emit once immediately to a new subscriber when driverChanged$ is subscribed to', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.driverChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should re-fetch the shared list and notify driverChanged$ when add/update/delete are called', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<Driver>>();
    const updateResponse$ = new Subject<WebApiResponse<Driver>>();
    const deleteResponse$ = new Subject<WebApiResponse<Driver>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);
    apiServiceMock.get.mockReturnValue(new Subject());
    let changedEmissions = 0;
    service.driverChanged$.subscribe(() => changedEmissions++);
    TestBed.flushEffects();
    expect(changedEmissions).toBe(1);
    const getCallsBefore = apiServiceMock.get.mock.calls.length;

    // Act / Assert
    service.add({} as Driver).subscribe();
    addResponse$.next({} as WebApiResponse<Driver>);
    TestBed.flushEffects();
    expect(apiServiceMock.get.mock.calls.length).toBe(getCallsBefore + 1);
    expect(changedEmissions).toBe(2);

    service.update({} as Driver).subscribe();
    updateResponse$.next({} as WebApiResponse<Driver>);
    TestBed.flushEffects();
    expect(apiServiceMock.get.mock.calls.length).toBe(getCallsBefore + 2);
    expect(changedEmissions).toBe(3);

    service.delete({} as Driver).subscribe();
    deleteResponse$.next({} as WebApiResponse<Driver>);
    TestBed.flushEffects();
    expect(apiServiceMock.get.mock.calls.length).toBe(getCallsBefore + 3);
    expect(changedEmissions).toBe(4);
  });
});
