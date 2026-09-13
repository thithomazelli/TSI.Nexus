import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, WebApiResponse } from '@nexus/core';
import { SelectableOption } from '../../models/selectable-option.model';
import { SelectableOptionGroup } from '../../enums/selectable-option-group.enum';
import { SelectableOptionService } from './selectable-option.service';

describe('SelectableOptionService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): SelectableOptionService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(SelectableOptionService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should call the getAll endpoint without caching when getAll is called twice', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getAll();
    service.getAll();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('selectableoptions/getAll');
    expect(apiServiceMock.get).toHaveBeenCalledTimes(2);
  });

  it('should not re-fetch when getByGroup is called twice for the same group', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getByGroup(SelectableOptionGroup.AddressType);
    service.getByGroup(SelectableOptionGroup.AddressType);

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith(
      `selectableoptions/getByGroup/${SelectableOptionGroup.AddressType}`,
    );
    expect(apiServiceMock.get).toHaveBeenCalledTimes(1);
  });

  it('should cache separately per group when getByGroup is called for different groups', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getByGroup(SelectableOptionGroup.AddressType);
    service.getByGroup(SelectableOptionGroup.EventType);

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledTimes(2);
  });

  it('should emit the loaded response when the getByGroup request resolves', () => {
    // Arrange
    const load$ = new Subject<WebApiResponse<SelectableOption[]>>();
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    apiServiceMock.get.mockReturnValue(load$);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    const service = TestBed.inject(SelectableOptionService);

    let response: WebApiResponse<SelectableOption[]> | undefined;
    service.getByGroup(SelectableOptionGroup.AddressType).subscribe((v) => (response = v));
    TestBed.flushEffects();
    expect(response).toBeUndefined();

    // Act
    const loaded = { data: [{ id: 'o1' } as SelectableOption] } as WebApiResponse<
      SelectableOption[]
    >;
    load$.next(loaded);
    TestBed.flushEffects();

    // Assert
    expect(response).toBe(loaded);
  });

  it('should complete after its single emission when getByGroup resolves (forkJoin compatibility)', () => {
    // Arrange
    const load$ = new Subject<WebApiResponse<SelectableOption[]>>();
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    apiServiceMock.get.mockReturnValue(load$);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    const service = TestBed.inject(SelectableOptionService);

    let completed = false;
    service
      .getByGroup(SelectableOptionGroup.AddressType)
      .subscribe({ complete: () => (completed = true) });
    TestBed.flushEffects();
    expect(completed).toBe(false);

    // Act
    load$.next({ data: [] } as unknown as WebApiResponse<SelectableOption[]>);
    TestBed.flushEffects();

    // Assert
    expect(completed).toBe(true);
  });

  it('should clear the group cache and allow a retry instead of hanging forever when the request errors', () => {
    // Arrange
    const service = createService();
    const load$ = new Subject<WebApiResponse<SelectableOption[]>>();
    apiServiceMock.get.mockReturnValue(load$);
    let completed = false;
    service
      .getByGroup(SelectableOptionGroup.AddressType)
      .subscribe({ complete: () => (completed = true) });

    // Act
    load$.error(new Error('fail'));
    expect(completed).toBe(false); // the errored cache entry never emits/completes itself

    const retry$ = new Subject<WebApiResponse<SelectableOption[]>>();
    apiServiceMock.get.mockReturnValue(retry$);
    let retried = false;
    service
      .getByGroup(SelectableOptionGroup.AddressType)
      .subscribe({ complete: () => (retried = true) });
    retry$.next({ data: [] } as unknown as WebApiResponse<SelectableOption[]>);
    TestBed.flushEffects();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledTimes(2);
    expect(retried).toBe(true);
  });

  it('should clear the per-group cache so the next getByGroup re-fetches when add, update or remove completes', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<SelectableOption>>();
    const updateResponse$ = new Subject<WebApiResponse<SelectableOption>>();
    const removeResponse$ = new Subject<WebApiResponse<SelectableOption>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(removeResponse$);
    apiServiceMock.get.mockReturnValue(new Subject());

    service.getByGroup(SelectableOptionGroup.AddressType);
    const getCallsAfterFirstFetch = apiServiceMock.get.mock.calls.length;

    // Act
    service.add({} as SelectableOption).subscribe();
    addResponse$.next({} as WebApiResponse<SelectableOption>);
    service.getByGroup(SelectableOptionGroup.AddressType);

    // Assert
    expect(apiServiceMock.get.mock.calls.length).toBe(getCallsAfterFirstFetch + 1);

    // Act
    service.update({} as SelectableOption).subscribe();
    updateResponse$.next({} as WebApiResponse<SelectableOption>);
    service.getByGroup(SelectableOptionGroup.AddressType);

    // Assert
    expect(apiServiceMock.get.mock.calls.length).toBe(getCallsAfterFirstFetch + 2);

    // Act
    service.remove({} as SelectableOption).subscribe();
    removeResponse$.next({} as WebApiResponse<SelectableOption>);
    service.getByGroup(SelectableOptionGroup.AddressType);

    // Assert
    expect(apiServiceMock.get.mock.calls.length).toBe(getCallsAfterFirstFetch + 3);
  });
});
