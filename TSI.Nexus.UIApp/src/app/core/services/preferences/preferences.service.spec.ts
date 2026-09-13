import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ApiService } from '@nexus/core';
import { PreferencesService, UpdatePreferences } from './preferences.service';

describe('PreferencesService', () => {
  let apiServiceMock: { put: ReturnType<typeof vi.fn> };

  function createService(): PreferencesService {
    apiServiceMock = { put: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: apiServiceMock }],
    });
    return TestBed.inject(PreferencesService);
  }

  it('should create the service when instantiated', () => {
    // Act
    const service = createService();

    // Assert
    expect(service).toBeTruthy();
  });

  it('should hit the expected endpoint with the preferences payload when update is called', () => {
    // Arrange
    const service = createService();
    apiServiceMock.put.mockReturnValue(new Subject());
    const model: UpdatePreferences = { theme: 'dark', language: 'pt-BR' };

    // Act
    service.update(model);

    // Assert
    expect(apiServiceMock.put).toHaveBeenCalledWith('account/preferences', model);
  });
});
