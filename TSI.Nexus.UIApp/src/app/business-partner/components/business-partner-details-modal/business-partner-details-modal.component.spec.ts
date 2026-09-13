import { MatDialogRef } from '@angular/material/dialog';
import { BusinessPartner, BusinessPartnerType, TranslationService } from '@nexus/core';
import { BusinessPartnerDetailsModalComponent } from './business-partner-details-modal.component';

describe('BusinessPartnerDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: any = null): BusinessPartnerDetailsModalComponent {
    dialogRefMock = { close: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    return new BusinessPartnerDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<BusinessPartnerDetailsModalComponent>,
      dialogData,
      translationServiceMock as unknown as TranslationService,
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
    expect(component.data).toEqual({});
    expect(component.id).toBeNull();
  });

  it('should initialize in edit mode when dialog data is provided', () => {
    // Arrange
    const businessPartner = {
      id: 'bp1',
      type: BusinessPartnerType.Client,
    } as BusinessPartner;

    // Act
    const component = createComponent({ isEdit: true, data: businessPartner, id: 'bp1' });

    // Assert
    expect(component.isEdit).toBe(true);
    expect(component.data).toBe(businessPartner);
    expect(component.id).toBe('bp1');
  });

  it('should fall back to defaults when dialog data omits data/id', () => {
    // Act
    const component = createComponent({ isEdit: true });

    // Assert
    expect(component.data).toEqual({});
    expect(component.id).toBeNull();
  });

  describe('ngOnInit / initializeTitle', () => {
    it('should build an "add client" title when adding a client', () => {
      // Arrange
      const component = createComponent({
        isEdit: false,
        data: { type: BusinessPartnerType.Client },
      });

      // Act
      component.ngOnInit();

      // Assert
      expect(translationServiceMock.instant).toHaveBeenCalledWith('SIDEBAR.CLIENTS');
      expect(translationServiceMock.instant).toHaveBeenCalledWith('COMMON.ADD_ENTITY', {
        entity: 'SIDEBAR.CLIENTS',
      });
      expect(component.title).toBe('COMMON.ADD_ENTITY');
    });

    it('should build an "edit supplier" title when editing a supplier', () => {
      // Arrange
      const component = createComponent({
        isEdit: true,
        data: { type: BusinessPartnerType.Supplier },
      });

      // Act
      component.ngOnInit();

      // Assert
      expect(translationServiceMock.instant).toHaveBeenCalledWith('SIDEBAR.SUPPLIERS');
      expect(translationServiceMock.instant).toHaveBeenCalledWith('COMMON.EDIT_ENTITY', {
        entity: 'SIDEBAR.SUPPLIERS',
      });
    });
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
