import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AgendaEvent, ApiService, WebApiResponse } from '@nexus/core';
import { EventService } from './event.service';

describe('EventService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): EventService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(EventService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit the expected endpoints when getAll/getById/getByUserId/getByEntityId are called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getAll();

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('events/getAll');

    service.getById('e1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('events/getById/e1');

    service.getByUserId('u1');
    expect(apiServiceMock.get).toHaveBeenCalledWith('events/getByUserId/u1');

    service.getByEntityId('t1', 'Trip');
    expect(apiServiceMock.get).toHaveBeenCalledWith('events/getByTripId/t1');
  });

  it('should emit once immediately to a new subscriber when eventChanged$ is subscribed to', () => {
    // Arrange
    const service = createService();
    let emissions = 0;

    // Act
    service.eventChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();

    // Assert
    expect(emissions).toBe(1);
  });

  it('should notify eventChanged$ after each request completes when add/update/delete are called', () => {
    // Arrange
    const service = createService();
    const addResponse$ = new Subject<WebApiResponse<AgendaEvent>>();
    const updateResponse$ = new Subject<WebApiResponse<AgendaEvent>>();
    const deleteResponse$ = new Subject<WebApiResponse<AgendaEvent>>();
    apiServiceMock.post.mockReturnValue(addResponse$);
    apiServiceMock.put.mockReturnValue(updateResponse$);
    apiServiceMock.delete.mockReturnValue(deleteResponse$);
    let emissions = 0;
    service.eventChanged$.subscribe(() => emissions++);
    TestBed.flushEffects();
    expect(emissions).toBe(1); // the initial replay

    // Act / Assert
    service.add({} as AgendaEvent).subscribe();
    addResponse$.next({} as WebApiResponse<AgendaEvent>);
    TestBed.flushEffects();
    expect(emissions).toBe(2);

    service.update({} as AgendaEvent).subscribe();
    updateResponse$.next({} as WebApiResponse<AgendaEvent>);
    TestBed.flushEffects();
    expect(emissions).toBe(3);

    service.delete({} as AgendaEvent).subscribe();
    deleteResponse$.next({} as WebApiResponse<AgendaEvent>);
    TestBed.flushEffects();
    expect(emissions).toBe(4);
  });

  it('should post to the expected endpoints with the given payload when add/update/delete are called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.post.mockReturnValue(new Subject());
    apiServiceMock.put.mockReturnValue(new Subject());
    apiServiceMock.delete.mockReturnValue(new Subject());
    const event = { id: 'e1' } as AgendaEvent;

    // Act
    service.add(event).subscribe();

    // Assert
    expect(apiServiceMock.post).toHaveBeenCalledWith('events/add', event);

    service.update(event).subscribe();
    expect(apiServiceMock.put).toHaveBeenCalledWith('events/update', event);

    service.delete(event).subscribe();
    expect(apiServiceMock.delete).toHaveBeenCalledWith('events/remove', event);
  });
});
