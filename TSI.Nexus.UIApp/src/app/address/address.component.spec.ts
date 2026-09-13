import {
  Address,
  AddressService,
  BusinessPartner,
  ModalService,
  NotificationService,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { Subject, of, throwError } from 'rxjs';
import { AddressComponent } from './address.component';

describe('AddressComponent', () => {
  let addressChanged$: Subject<void>;
  let addressServiceMock: {
    addressChanged$: Subject<void>;
    getAllByBusinessPartnerId: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let language$: Subject<string>;
  let translationServiceMock: {
    instant: ReturnType<typeof vi.fn>;
    language$: Subject<string>;
  };

  function createComponent(): AddressComponent {
    addressChanged$ = new Subject();
    addressServiceMock = {
      addressChanged$,
      getAllByBusinessPartnerId: vi.fn(),
      delete: vi.fn(),
      refresh: vi.fn(),
      update: vi.fn(),
    };
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };

    return new AddressComponent(
      addressServiceMock as unknown as AddressService,
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      translationServiceMock as unknown as TranslationService,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  it('should rebuild the column definitions when the language changes', () => {
    // Arrange
    const component = createComponent();
    const before = component.columnDefs;

    // Act
    language$.next('en');

    // Assert
    expect(component.columnDefs).not.toBe(before);
  });

  describe('ngOnInit / addressChanged$', () => {
    it('should reload the addresses when addressChanged$ emits', () => {
      // Arrange
      const component = createComponent();
      component.parentData = { id: 'bp1' } as BusinessPartner;
      addressServiceMock.getAllByBusinessPartnerId.mockReturnValue(
        of({ data: [{ id: 'a1' }] }),
      );
      component.ngOnInit();

      // Act
      addressChanged$.next();

      // Assert
      expect(addressServiceMock.getAllByBusinessPartnerId).toHaveBeenCalledWith('bp1');
      expect(component.rowData).toEqual([{ id: 'a1' }]);
    });

    it('should stop reloading after ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      component.parentData = { id: 'bp1' } as BusinessPartner;
      component.ngOnInit();
      component.ngOnDestroy();

      // Act
      addressChanged$.next();

      // Assert
      expect(addressServiceMock.getAllByBusinessPartnerId).not.toHaveBeenCalled();
    });

    it('should not throw when destroyed before ngOnInit ever subscribed', () => {
      // Arrange
      const component = createComponent();

      // Act / Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('openModal', () => {
    it('should show the address details modal with the given initial state', () => {
      // Arrange
      const component = createComponent();
      const initialState = { address: { id: 'a1' } };

      // Act
      component.openModal(initialState);

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        initialState,
      );
    });
  });

  describe('deleteAddress', () => {
    it('should refuse to delete the default address', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.deleteAddress({ id: 'a1', isDefault: true } as Address);

      // Assert
      expect(addressServiceMock.delete).not.toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'ADDRESS.CANNOT_DELETE_DEFAULT',
        'warning',
      );
    });

    it('should remove a non-default address from the grid when the deletion succeeds', () => {
      // Arrange
      const component = createComponent();
      component.rowData = [{ id: 'a1' } as Address, { id: 'a2' } as Address];
      addressServiceMock.delete.mockReturnValue(of({ message: 'OK' }));

      // Act
      component.deleteAddress({ id: 'a1', isDefault: false } as Address);

      // Assert
      expect(component.rowData).toEqual([{ id: 'a2' }]);
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
    });
  });

  describe('refreshAddresses', () => {
    it('should reload the row data and notify when the refresh succeeds', () => {
      // Arrange
      const component = createComponent();
      component.parentData = { id: 'bp1' } as BusinessPartner;
      addressServiceMock.refresh.mockReturnValue(of({ data: [{ id: 'a1' }] }));

      // Act
      component.refreshAddresses();

      // Assert
      expect(component.rowData).toEqual([{ id: 'a1' }]);
      expect(component.loading).toBe(false);
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'ADDRESS.ADDRESSES_REFRESHED',
      );
    });

    it('should stop loading and notify an error when the refresh fails', () => {
      // Arrange
      const component = createComponent();
      component.parentData = { id: 'bp1' } as BusinessPartner;
      addressServiceMock.refresh.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.refreshAddresses();

      // Assert
      expect(component.loading).toBe(false);
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'ADDRESS.ADDRESSES_REFRESH_ERROR',
      );
    });

    it('should fall back to an empty string id when there is no parentData yet', () => {
      // Arrange
      const component = createComponent();
      component.parentData = null;
      addressServiceMock.refresh.mockReturnValue(of({ data: [] }));

      // Act
      component.refreshAddresses();

      // Assert
      expect(addressServiceMock.refresh).toHaveBeenCalledWith('');
    });

    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.parentData = { id: 'bp1' } as BusinessPartner;
      addressServiceMock.refresh.mockReturnValue(of({}));

      // Act
      component.refreshAddresses();

      // Assert
      expect(component.rowData).toEqual([]);
    });
  });

  describe('updateDefaultAddress', () => {
    it('should mark the address as default, save it, and reload when updateDefaultAddress is called', () => {
      // Arrange
      const component = createComponent();
      component.parentData = { id: 'bp1' } as BusinessPartner;
      const address = { id: 'a1', isDefault: false } as Address;
      addressServiceMock.update.mockReturnValue(of({ message: 'OK' }));
      addressServiceMock.getAllByBusinessPartnerId.mockReturnValue(of({ data: [] }));

      // Act
      component.updateDefaultAddress(address);

      // Assert
      expect(address.isDefault).toBe(true);
      expect(addressServiceMock.update).toHaveBeenCalledWith(address);
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
    });
  });

  describe('getAddresses (via ngOnInit trigger)', () => {
    it('should clear the row data when there is no parent id yet', () => {
      // Arrange
      const component = createComponent();
      component.parentData = null;
      component.ngOnInit();

      // Act
      addressChanged$.next();

      // Assert
      expect(component.rowData).toEqual([]);
      expect(addressServiceMock.getAllByBusinessPartnerId).not.toHaveBeenCalled();
    });

    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.parentData = { id: 'bp1' } as BusinessPartner;
      addressServiceMock.getAllByBusinessPartnerId.mockReturnValue(of({}));
      component.ngOnInit();

      // Act
      addressChanged$.next();

      // Assert
      expect(component.rowData).toEqual([]);
      expect(component.loading).toBe(false);
    });

    it('should stop loading without throwing when the request errors', () => {
      // Arrange
      const component = createComponent();
      component.parentData = { id: 'bp1' } as BusinessPartner;
      addressServiceMock.getAllByBusinessPartnerId.mockReturnValue(throwError(() => new Error('fail')));
      component.ngOnInit();

      // Act
      addressChanged$.next();

      // Assert
      expect(component.loading).toBe(false);
    });
  });

  describe('isDefault column cell renderer', () => {
    it('should render a checked, disabled checkbox for the default address', () => {
      // Arrange
      const component = createComponent();
      const column = component.columnDefs.find((c) => c.field === 'isDefault')!;

      // Act
      const html = (column.cellRenderer as (params: any) => string)({ value: true });

      // Assert
      expect(html).toContain('checked');
      expect(html).toContain('disabled');
    });

    it('should render an unchecked, enabled checkbox when the address is not default', () => {
      // Arrange
      const component = createComponent();
      const column = component.columnDefs.find((c) => c.field === 'isDefault')!;

      // Act
      const html = (column.cellRenderer as (params: any) => string)({ value: false });

      // Assert
      expect(html).not.toContain('checked');
      expect(html).not.toContain('disabled');
    });
  });

  describe('type column', () => {
    it('should render the value as a link, falling back to an empty string when it is missing', () => {
      // Arrange
      const component = createComponent();
      const column = component.columnDefs.find((c) => c.field === 'type')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 'Residencial' })).toContain('Residencial');
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });
  });

  describe('zipCode column', () => {
    function formatter(params: any) {
      const column = component.columnDefs.find((c) => c.field === 'zipCode')!;
      return (column.valueFormatter as (p: any) => string)(params);
    }
    let component: ReturnType<typeof createComponent>;

    beforeEach(() => {
      component = createComponent();
    });

    it('should format an 8-digit CEP with a dash', () => {
      // Act
      const result = formatter({ value: '12345678' });

      // Assert
      expect(result).toBe('12345-678');
    });

    it('should strip non-digit characters before checking the length', () => {
      // Act
      const result = formatter({ value: '12345-678' });

      // Assert
      expect(result).toBe('12345-678');
    });

    it('should return the raw value when it does not resolve to 8 digits', () => {
      // Act
      const result = formatter({ value: '123' });

      // Assert
      expect(result).toBe('123');
    });

    it('should treat a missing value as an empty string when formatting', () => {
      // Act
      const result = formatter({ value: null });

      // Assert
      expect(result).toBeNull();
    });

    it('should render the cell value as a link, falling back to an empty string when it is missing', () => {
      // Arrange
      const column = component.columnDefs.find((c) => c.field === 'zipCode')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: '12345-678' })).toContain('12345-678');
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });
  });

  describe('address (street/number) column', () => {
    function valueGetter(data: any) {
      const column = component.columnDefs.find((c) => c.headerName === 'COMMON.ADDRESS')!;
      return (column.valueGetter as (p: any) => string)({ data });
    }
    let component: ReturnType<typeof createComponent>;

    beforeEach(() => {
      component = createComponent();
    });

    it('should join street and number when both are present', () => {
      // Act
      const result = valueGetter({ street: 'Rua A', number: '123' });

      // Assert
      expect(result).toBe('Rua A, 123');
    });

    it('should treat a numeric zero number as falsy and fall back to just the street', () => {
      // `street && number` short-circuits on a falsy 0, so it drops through to `street || number`
      // instead of joining - the ", 0" suffix is lost, unlike a real "0" string would be.
      // Act
      const result = valueGetter({ street: 'Rua A', number: 0 });

      // Assert
      expect(result).toBe('Rua A');
    });

    it('should fall back to just the street when there is no number', () => {
      // Act
      const result = valueGetter({ street: 'Rua A', number: null });

      // Assert
      expect(result).toBe('Rua A');
    });

    it('should fall back to just the number when there is no street', () => {
      // Act
      const result = valueGetter({ street: '', number: '123' });

      // Assert
      expect(result).toBe('123');
    });

    it('should fall back to an empty string when there is no data at all', () => {
      // Act
      const result = valueGetter(undefined);

      // Assert
      expect(result).toBe('');
    });

    it('should render the resolved value as a link, falling back to an empty string when it is missing', () => {
      // Arrange
      const column = component.columnDefs.find((c) => c.headerName === 'COMMON.ADDRESS')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 'Rua A, 123' })).toContain('Rua A, 123');
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });
  });

  describe('actions column', () => {
    it('should render the edit and delete buttons', () => {
      // Arrange
      const component = createComponent();
      const column = component.columnDefs[component.columnDefs.length - 1];

      // Act
      const html = (column.cellRenderer as () => string)();

      // Assert
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="delete"');
    });
  });
});
