import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService, ResponseStatus } from '@nexus/core';
import { User } from '../../models';
import { WebApiResponse } from '../../utilities';
import { UserService } from './user.service';

describe('UserService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): UserService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    apiServiceMock.get.mockReturnValue(new Subject());
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(UserService);
  }

  it('should be created when injected', () => {
    // Act / Assert
    expect(createService()).toBeTruthy();
  });

  it('should trigger a getAll fetch eagerly on construction', () => {
    // Act
    createService();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('users/getAll');
  });

  it('should emit the loaded response on users$/getAll() once the request resolves', () => {
    // Arrange
    const load$ = new Subject<WebApiResponse<User[]>>();
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    apiServiceMock.get.mockReturnValue(load$);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    const service = TestBed.inject(UserService);
    let response: WebApiResponse<User[]> | undefined;
    service.getAll().subscribe((v) => (response = v));
    TestBed.flushEffects();
    expect(response).toBeUndefined();

    // Act
    const loaded = { data: [{ id: 'u1' } as User] } as WebApiResponse<User[]>;
    load$.next(loaded);
    TestBed.flushEffects();

    // Assert
    expect(response).toBe(loaded);
  });

  it('should emit an empty fallback response on users$ instead of hanging forever when the initial load fails', () => {
    // Arrange
    const load$ = new Subject<WebApiResponse<User[]>>();
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    apiServiceMock.get.mockReturnValue(load$);
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    const service = TestBed.inject(UserService);
    let response: WebApiResponse<User[]> | undefined;
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
    expect(apiServiceMock.get).toHaveBeenCalledWith(expect.stringContaining('users/getAllPaged?'));
    expect(result).toBe(pagedResult);
  });

  it('should hit the expected endpoint when getById is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getById('u1');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('users/getById/u1');
  });

  it('should re-fetch the shared users$ cache when refresh is called', () => {
    // Arrange
    const service = createService();
    const getCallsBefore = apiServiceMock.get.mock.calls.length;
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.refresh();

    // Assert
    expect(apiServiceMock.get.mock.calls.length).toBe(getCallsBefore + 1);
  });

  it('should emit once immediately to a new subscriber when userChanged$ is subscribed to', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.userChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should re-fetch the shared list and notify userChanged$ when add/update/delete are called', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<User>>();
    const updateResponse$ = new Subject<WebApiResponse<User>>();
    const deleteResponse$ = new Subject<WebApiResponse<User>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);
    apiServiceMock.get.mockReturnValue(new Subject());
    let changedEmissions = 0;
    service.userChanged$.subscribe(() => changedEmissions++);
    TestBed.flushEffects();
    expect(changedEmissions).toBe(1);
    const getCallsBefore = apiServiceMock.get.mock.calls.length;

    // Act / Assert
    service.add({} as User).subscribe();
    addResponse$.next({} as WebApiResponse<User>);
    TestBed.flushEffects();
    expect(apiServiceMock.get.mock.calls.length).toBe(getCallsBefore + 1);
    expect(changedEmissions).toBe(2);

    service.update({} as User).subscribe();
    updateResponse$.next({} as WebApiResponse<User>);
    TestBed.flushEffects();
    expect(apiServiceMock.get.mock.calls.length).toBe(getCallsBefore + 2);
    expect(changedEmissions).toBe(3);

    service.delete({} as User).subscribe();
    deleteResponse$.next({} as WebApiResponse<User>);
    TestBed.flushEffects();
    expect(apiServiceMock.get.mock.calls.length).toBe(getCallsBefore + 3);
    expect(changedEmissions).toBe(4);
  });
});
