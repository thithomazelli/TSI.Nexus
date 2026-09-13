import { MatDialogRef } from '@angular/material/dialog';
import { Quote } from '@nexus/core';
import { QuoteDetailsModalComponent } from './quote-details-modal.component';

describe('QuoteDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: any = null): QuoteDetailsModalComponent {
    dialogRefMock = { close: vi.fn() };
    return new QuoteDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<QuoteDetailsModalComponent>,
      dialogData,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  it('should default to add mode with an empty quote-products list when there is no dialog data', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toEqual({ quoteProducts: [] });
    expect(component.id).toBeNull();
  });

  it('should initialize from dialog data when in edit mode', () => {
    // Arrange
    const quote = { id: 'q1', quoteProducts: [{ id: 'qp1' }] } as unknown as Quote;

    // Act
    const component = createComponent({ isEdit: true, data: quote, id: 'q1' });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(quote);
    expect(component.id).toBe('q1');
  });

  it('should fall back to defaults when dialog data omits fields', () => {
    // Act
    const component = createComponent({});

    // Assert
    expect(component.isEdit).toBe(false);
    expect(component.data).toEqual({ quoteProducts: [] });
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
