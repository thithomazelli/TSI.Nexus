import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService } from '@nexus/core';
import { EventParticipant } from '../../models';
import { EventParticipantService } from './event-participant.service';

describe('EventParticipantService', () => {
  let apiServiceMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  function createService(): EventParticipantService {
    apiServiceMock = { get: vi.fn(), post: vi.fn(), delete: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(EventParticipantService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should call the getByEventId endpoint when getByEventId is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.get.mockReturnValue(new Subject());

    // Act
    service.getByEventId('e1');

    // Assert
    expect(apiServiceMock.get).toHaveBeenCalledWith('eventparticipants/getByEventId/e1');
  });

  it('should call the add endpoint with the participant payload when add is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.post.mockReturnValue(new Subject());
    const participant = { id: 'p1' } as EventParticipant;

    // Act
    service.add(participant);

    // Assert
    expect(apiServiceMock.post).toHaveBeenCalledWith('eventparticipants/add', participant);
  });

  it('should call the remove endpoint with the participant payload when delete is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.delete.mockReturnValue(new Subject());
    const participant = { id: 'p1' } as EventParticipant;

    // Act
    service.delete(participant);

    // Assert
    expect(apiServiceMock.delete).toHaveBeenCalledWith('eventparticipants/remove', participant);
  });
});
