import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import {
  BusinessPartner,
  BusinessPartnerService,
  BusinessPartnerType,
  ModalService,
  NotificationService,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { GridApi } from 'ag-grid-community';
import { Subject, of, throwError } from 'rxjs';
import { BusinessPartnersComponent } from './business-partners.component';
import { GridComponent } from '../shared/grid/grid.component';

describe('BusinessPartnersComponent', () => {
  let businessPartnerChanged$: Subject<void>;
  let businessPartnerServiceMock: {
    getAllPaged: ReturnType<typeof vi.fn>;
    businessPartnerChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
  };
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let routerMock: { url: string };
  let language$: Subject<string>;
  let translationServiceMock: {
    instant: ReturnType<typeof vi.fn>;
    language$: Subject<string>;
  };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(url: string): BusinessPartnersComponent {
    businessPartnerChanged$ = new Subject();
    businessPartnerServiceMock = {
      getAllPaged: vi.fn(),
      businessPartnerChanged$,
      delete: vi.fn(),
      refresh: vi.fn(),
    };
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    routerMock = { url };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };
    cdrMock = { markForCheck: vi.fn() };

    return new BusinessPartnersComponent(
      businessPartnerServiceMock as unknown as BusinessPartnerService,
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      routerMock as unknown as Router,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  function mockGridRef(): GridComponent<BusinessPartner> {
    return {
      gridApi: { purgeInfiniteCache: vi.fn() } as unknown as GridApi,
    } as unknown as GridComponent<BusinessPartner>;
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent('/clients');

    // Assert
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should detect the clients route when ngOnInit is called', () => {
      // Arrange
      const component = createComponent('/clients');

      // Act
      component.ngOnInit();

      // Assert
      expect(component.baseEndPoint).toBe('clients');
      expect(component.businessPartnerType).toBe(BusinessPartnerType.Client);
      expect(component.columnDefs.length).toBeGreaterThan(0);
    });

    it('should detect the suppliers route when ngOnInit is called', () => {
      // Arrange
      const component = createComponent('/suppliers');

      // Act
      component.ngOnInit();

      // Assert
      expect(component.baseEndPoint).toBe('suppliers');
      expect(component.businessPartnerType).toBe(BusinessPartnerType.Supplier);
    });

    it('should re-initialize when the language changes', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      const before = component.columnDefs;

      // Act
      language$.next('en');

      // Assert
      expect(component.columnDefs).not.toBe(before);
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should ignore the first (replay) emission but purge the cache on later changes', () => {
      // Arrange
      const component = createComponent('/clients');
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();

      // Act
      businessPartnerChanged$.next();
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
      businessPartnerChanged$.next();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalledTimes(1);
    });

    it('should stop reacting when ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent('/clients');
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();
      component.ngOnDestroy();

      // Act
      businessPartnerChanged$.next();
      businessPartnerChanged$.next();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
    });

    it('should not throw when destroyed before ngOnInit ever subscribed', () => {
      // Arrange
      const component = createComponent('/clients');

      // Act / Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should fall back to an empty title/baseEndPoint when the url matches neither route', () => {
      // Arrange
      const component = createComponent('/other');

      // Act
      component.ngOnInit();

      // Assert
      expect(component.baseEndPoint).toBe('');
      expect(component.title).toBe('');
    });
  });

  describe('pagedDataSource', () => {
    it('should request the correct partner type when pagedDataSource is called', () => {
      // Arrange
      const component = createComponent('/suppliers');
      component.ngOnInit();

      // Act
      component.pagedDataSource({ page: 1, pageSize: 10 });

      // Assert
      expect(businessPartnerServiceMock.getAllPaged).toHaveBeenCalledWith(
        BusinessPartnerType.Supplier,
        { page: 1, pageSize: 10 },
      );
    });
  });

  describe('openModal', () => {
    it('should tag the initial state with the client type when the route is clients', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();

      // Act
      component.openModal({ isEdit: false, data: {} });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: { type: BusinessPartnerType.Client } }),
      );
    });

    it('should tag the initial state with the supplier type when the route is suppliers', () => {
      // Arrange
      const component = createComponent('/suppliers');
      component.ngOnInit();

      // Act
      component.openModal({ isEdit: false, data: {} });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ data: { type: BusinessPartnerType.Supplier } }),
      );
    });
  });

  describe('deleteBusinessPartner', () => {
    it('should purge the grid cache and notify when the deletion succeeds', () => {
      // Arrange
      const component = createComponent('/clients');
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      businessPartnerServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteBusinessPartner({ id: 'bp1' } as BusinessPartner);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Removido',
        ResponseStatus.Success,
      );
    });

    it('should not purge the grid cache when the deletion fails', () => {
      // Arrange
      const component = createComponent('/clients');
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      businessPartnerServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falha' }),
      );

      // Act
      component.deleteBusinessPartner({ id: 'bp1' } as BusinessPartner);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
    });
  });

  describe('refreshBusinessPartners', () => {
    it('should show a clients-specific success message when the route is clients', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      businessPartnerServiceMock.refresh.mockReturnValue(of(undefined));

      // Act
      component.refreshBusinessPartners();

      // Assert
      expect(businessPartnerServiceMock.refresh).toHaveBeenCalledWith(BusinessPartnerType.Client);
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'BUSINESS_PARTNER.CLIENTS_REFRESHED',
      );
    });

    it('should show a suppliers-specific success message when the route is suppliers', () => {
      // Arrange
      const component = createComponent('/suppliers');
      component.ngOnInit();
      businessPartnerServiceMock.refresh.mockReturnValue(of(undefined));

      // Act
      component.refreshBusinessPartners();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'BUSINESS_PARTNER.SUPPLIERS_REFRESHED',
      );
    });

    it('should show a suppliers-specific error message when the refresh fails', () => {
      // Arrange
      const component = createComponent('/suppliers');
      component.ngOnInit();
      businessPartnerServiceMock.refresh.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.refreshBusinessPartners();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'BUSINESS_PARTNER.SUPPLIERS_REFRESH_ERROR',
      );
    });

    it('should show a clients-specific error message when the refresh fails', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      businessPartnerServiceMock.refresh.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.refreshBusinessPartners();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'BUSINESS_PARTNER.CLIENTS_REFRESH_ERROR',
      );
    });
  });

  describe('CPF/CNPJ column cell renderer', () => {
    it('should format an 11-digit CPF when the document belongs to an individual', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      const column = component.columnDefs.find(
        (c) => c.headerName === 'BUSINESS_PARTNER.CPF_CNPJ',
      )!;

      // Act
      const result = (column.cellRenderer as (params: any) => string)({
        data: { documentType: 'Física', socialSecurityCard: '52998224725' },
      });

      // Assert
      expect(result).toBe('529.982.247-25');
    });

    it('should format a 14-digit CNPJ when the document belongs to a company', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      const column = component.columnDefs.find(
        (c) => c.headerName === 'BUSINESS_PARTNER.CPF_CNPJ',
      )!;

      // Act
      const result = (column.cellRenderer as (params: any) => string)({
        data: { documentType: 'Jurídica', nationalRegistry: '11222333000181' },
      });

      // Assert
      expect(result).toBe('11.222.333/0001-81');
    });

    it('should fall back to an empty string when the individual document is missing', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      const column = component.columnDefs.find(
        (c) => c.headerName === 'BUSINESS_PARTNER.CPF_CNPJ',
      )!;

      // Act
      const result = (column.cellRenderer as (params: any) => string)({
        data: { documentType: 'Física' },
      });

      // Assert
      expect(result).toBe('');
    });

    it('should fall back to an empty string when the company document is missing', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      const column = component.columnDefs.find(
        (c) => c.headerName === 'BUSINESS_PARTNER.CPF_CNPJ',
      )!;

      // Act
      const result = (column.cellRenderer as (params: any) => string)({
        data: { documentType: 'Jurídica' },
      });

      // Assert
      expect(result).toBe('');
    });

    it('should return the raw value when the digit count matches neither CPF nor CNPJ', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      const column = component.columnDefs.find(
        (c) => c.headerName === 'BUSINESS_PARTNER.CPF_CNPJ',
      )!;

      // Act
      const result = (column.cellRenderer as (params: any) => string)({
        data: { documentType: 'Física', socialSecurityCard: '123' },
      });

      // Assert
      expect(result).toBe('123');
    });
  });

  describe('name column cell renderer', () => {
    it('should render the value as a link, falling back to an empty string when missing', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'name')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 'Cliente A' })).toContain(
        'Cliente A',
      );
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });
  });

  describe('email column cell renderer', () => {
    it('should render the value as a link, falling back to an empty string when missing', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'email')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: 'a@b.com' })).toContain(
        'a@b.com',
      );
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toContain('ag-link');
    });
  });

  describe('phone column cell renderer', () => {
    it('should format a 10-digit phone number when rendered', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'phone')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: '1122223333' })).toBe(
        '(11) 2222-3333',
      );
    });

    it('should return the raw value when it does not have 10 digits', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'phone')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: '123' })).toBe('123');
    });

    it('should treat a missing value as an empty string', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'phone')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toBe('');
    });
  });

  describe('mobile column cell renderer', () => {
    it('should format an 11-digit mobile number when rendered', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'mobile')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: '11922223333' })).toBe(
        '(11) 9 2222-3333',
      );
    });

    it('should return the raw value when it does not have 11 digits', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'mobile')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: '123' })).toBe('123');
    });

    it('should treat a missing value as an empty string', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'mobile')!;

      // Act / Assert
      expect((column.cellRenderer as (p: any) => string)({ value: null })).toBe('');
    });
  });

  describe('actions column cell renderer', () => {
    it('should render the view, edit and delete buttons when rendered', () => {
      // Arrange
      const component = createComponent('/clients');
      component.ngOnInit();
      const column = component.columnDefs[component.columnDefs.length - 1];

      // Act
      const html = (column.cellRenderer as () => string)();

      // Assert
      expect(html).toContain('data-action="view"');
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="delete"');
    });
  });
});
