import { MatDialogRef } from '@angular/material/dialog';
import { User } from '@nexus/core';
import { UserDetailsModalComponent } from './user-details-modal.component';

describe('UserDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: any = null): UserDetailsModalComponent {
    dialogRefMock = { close: vi.fn() };
    return new UserDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<UserDetailsModalComponent>,
      dialogData,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  it('should default to add mode with no data when there is no dialog data', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toBeNull();
    expect(component.id).toBeNull();
  });

  it('should initialize from dialog data when in edit mode', () => {
    // Arrange
    const user = { id: 'u1' } as User;

    // Act
    const component = createComponent({ isEdit: true, data: user, id: 'u1' });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(user);
    expect(component.id).toBe('u1');
  });

  it('should fall back to defaults when dialog data omits fields', () => {
    // Act
    const component = createComponent({});

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toBeNull();
    expect(component.id).toBeNull();
  });

  describe('close', () => {
    it('should close the dialog with no result when close is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.close();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith(null);
    });
  });
});
