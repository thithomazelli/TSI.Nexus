import { of } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { User, UserService } from '@nexus/core';
import { AuditTabComponent } from './audit-tab.component';

describe('AuditTabComponent', () => {
  let userServiceMock: { getById: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };
  let component: AuditTabComponent;

  beforeEach(() => {
    userServiceMock = { getById: vi.fn() };
    cdrMock = { markForCheck: vi.fn() };
    component = new AuditTabComponent(
      userServiceMock as unknown as UserService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  });

  it('should create the component when instantiated', () => {
    // Assert
    expect(component).toBeTruthy();
  });

  it('should do nothing when ngOnChanges fires without a "data" change', () => {
    // Act
    component.ngOnChanges({});

    // Assert
    expect(userServiceMock.getById).not.toHaveBeenCalled();
  });

  it('should resolve both create and modify user names and mark for check when both ids are present', () => {
    // Arrange
    userServiceMock.getById.mockImplementation((id: string) =>
      of({
        data: id === 'u1' ? { firstName: 'Ana', lastName: 'Silva' } : { firstName: 'Joao', lastName: 'Souza' },
      }),
    );
    component.data = { createUserId: 'u1', modifyUserId: 'u2' };

    // Act
    component.ngOnChanges({ data: {} as never });

    // Assert
    expect(userServiceMock.getById).toHaveBeenCalledWith('u1');
    expect(userServiceMock.getById).toHaveBeenCalledWith('u2');
    expect(component.createUserName).toBe('Ana Silva');
    expect(component.modifyUserName).toBe('Joao Souza');
    expect(cdrMock.markForCheck).toHaveBeenCalledTimes(2);
  });

  it('should not call the service when an id is not present', () => {
    // Arrange
    userServiceMock.getById.mockReturnValue(of({ data: { firstName: 'Ana' } as User }));
    component.data = { createUserId: 'u1' };

    // Act
    component.ngOnChanges({ data: {} as never });

    // Assert
    expect(userServiceMock.getById).toHaveBeenCalledTimes(1);
    expect(userServiceMock.getById).toHaveBeenCalledWith('u1');
    expect(cdrMock.markForCheck).toHaveBeenCalledTimes(1);
  });

  it('should reset both names to empty when resolving on every data change', () => {
    // Arrange
    component.createUserName = 'stale name';
    component.modifyUserName = 'stale name';
    component.data = null;

    // Act
    component.ngOnChanges({ data: {} as never });

    // Assert
    expect(component.createUserName).toBe('');
    expect(component.modifyUserName).toBe('');
  });

  it('should fall back to userName when first/last name are both absent', () => {
    // Arrange
    userServiceMock.getById.mockReturnValue(of({ data: { userName: 'ana.silva' } as User }));
    component.data = { createUserId: 'u1' };

    // Act
    component.ngOnChanges({ data: {} as never });

    // Assert
    expect(component.createUserName).toBe('ana.silva');
  });

  it('should resolve to an empty string when the user is not found', () => {
    // Arrange
    userServiceMock.getById.mockReturnValue(of({ data: null }));
    component.data = { createUserId: 'u1' };

    // Act
    component.ngOnChanges({ data: {} as never });

    // Assert
    expect(component.createUserName).toBe('');
  });
});
