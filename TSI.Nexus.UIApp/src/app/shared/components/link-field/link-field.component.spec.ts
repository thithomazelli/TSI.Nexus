import { Router } from '@angular/router';
import { ModalService } from '@nexus/core';
import { LinkFieldComponent } from './link-field.component';

describe('LinkFieldComponent', () => {
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let modalServiceMock: { hideModal: ReturnType<typeof vi.fn> };

  function createComponent(): LinkFieldComponent {
    routerMock = { navigate: vi.fn() };
    modalServiceMock = { hideModal: vi.fn() };

    return new LinkFieldComponent(
      routerMock as unknown as Router,
      modalServiceMock as unknown as ModalService,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('onClick', () => {
    it('should navigate and hide the modal when linkUrl has segments', () => {
      // Arrange
      const component = createComponent();
      component.linkUrl = ['/orders', 'o1'];

      // Act
      component.onClick();

      // Assert
      expect(routerMock.navigate).toHaveBeenCalledWith(['/orders', 'o1']);
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
    });

    it('should do nothing when linkUrl is empty', () => {
      // Arrange
      const component = createComponent();
      component.linkUrl = [];

      // Act
      component.onClick();

      // Assert
      expect(routerMock.navigate).not.toHaveBeenCalled();
      expect(modalServiceMock.hideModal).not.toHaveBeenCalled();
    });

    it('should do nothing when linkUrl is not set', () => {
      // Arrange
      const component = createComponent();
      component.linkUrl = undefined as unknown as string[];

      // Act
      // Assert
      expect(() => component.onClick()).not.toThrow();
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });
});
