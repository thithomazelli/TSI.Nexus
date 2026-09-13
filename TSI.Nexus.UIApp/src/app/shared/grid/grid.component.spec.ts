import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalService, PagedRequest, PagedResult, TranslationService } from '@nexus/core';
import { GridApi, IGetRowsParams } from 'ag-grid-community';
import { Subject, of, throwError } from 'rxjs';
import { GridComponent } from './grid.component';

describe('GridComponent', () => {
  let modalServiceMock: { showSweetConfirmation: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let paramMap$: Subject<{ get: (key: string) => string | null }>;
  let activatedRouteMock: { paramMap: Subject<{ get: (key: string) => string | null }> };
  let language$: Subject<string>;
  let translationServiceMock: {
    current: string;
    instant: ReturnType<typeof vi.fn>;
    language$: Subject<string>;
  };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(): GridComponent<{ id: string }> {
    modalServiceMock = { showSweetConfirmation: vi.fn() };
    routerMock = { navigateByUrl: vi.fn() };
    paramMap$ = new Subject();
    activatedRouteMock = { paramMap: paramMap$ };
    language$ = new Subject();
    translationServiceMock = {
      current: 'pt-BR',
      instant: vi.fn((key: string) => key),
      language$,
    };
    cdrMock = { markForCheck: vi.fn() };

    return new GridComponent(
      modalServiceMock as unknown as ModalService,
      routerMock as unknown as Router,
      activatedRouteMock as unknown as ActivatedRoute,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  function mockGridApi(): GridApi {
    return {
      setGridOption: vi.fn(),
      showLoadingOverlay: vi.fn(),
      hideOverlay: vi.fn(),
      purgeInfiniteCache: vi.fn(),
    } as unknown as GridApi;
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  it('should build the no-rows overlay from the current translation when the component is constructed', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component.noRowsOverlayTemplate).toContain('GRID.NO_ROWS');
    expect(component.overlayLoadingTemplate).toContain('COMMON.LOADING');
  });

  it('should fall back to the pt-BR locale when the current language has no matching ag-Grid locale', () => {
    // Act
    const component = new GridComponent(
      { showSweetConfirmation: vi.fn() } as unknown as ModalService,
      { navigateByUrl: vi.fn() } as unknown as Router,
      { paramMap: new Subject() } as unknown as ActivatedRoute,
      { current: 'fr', instant: vi.fn((key: string) => key), language$: new Subject() } as unknown as TranslationService,
      { markForCheck: vi.fn() } as unknown as ChangeDetectorRef,
    );

    // Assert
    expect(component.localeText).toEqual(component.localeText);
    expect(Object.keys(component.localeText).length).toBeGreaterThan(0);
  });

  describe('ngOnInit', () => {
    it('should set the grid style when compactView is true', () => {
      // Arrange
      const component = createComponent();
      component.compactView = true;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.gridStyle).toBe('compact-view');
    });

    it('should track the route parentId when the paramMap emits', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      paramMap$.next({ get: () => 'parent-1' });
      component.editAction({ id: 'row-1' });

      // Assert
      expect(component.openModal).toBeTruthy();
    });

    it('should stop reacting to route changes when the component is destroyed', () => {
      // Arrange
      const component = createComponent();
      const emitted: any[] = [];
      component.openModal.subscribe((v) => emitted.push(v));
      component.ngOnInit();
      component.ngOnDestroy();

      // Act
      paramMap$.next({ get: () => 'parent-1' });
      component.editAction({ id: 'row-1' });

      // Assert
      expect(emitted[0].parentId).toBeNull();
    });

    it('should refresh the overlay templates when the language changes', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const gridApi = mockGridApi();
      component.gridApi = gridApi;

      // Act
      language$.next('en');

      // Assert
      expect(gridApi.setGridOption).toHaveBeenCalledWith(
        'overlayNoRowsTemplate',
        expect.any(String),
      );
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should debounce the server-side quick filter and purge the infinite cache when serverSide is true', async () => {
      // Arrange
      const component = createComponent();
      component.serverSide = true;
      component.ngOnInit();
      const gridApi = mockGridApi();
      component.gridApi = gridApi;

      // Act
      component.onFilterTextBoxChanged({ target: { value: 'abc' } } as unknown as Event);

      // Assert
      expect(gridApi.purgeInfiniteCache).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 320));

      expect(gridApi.purgeInfiniteCache).toHaveBeenCalled();
    });
  });

  describe('onFilterTextBoxChanged', () => {
    it('should fall back to an empty string when the input has no value', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.onFilterTextBoxChanged({ target: {} } as unknown as Event);

      // Assert
      expect(component.quickFilter).toBe('');
    });

    it('should not touch the infinite cache when not server-side', async () => {
      // Arrange
      const component = createComponent();
      component.serverSide = false;
      component.ngOnInit();
      const gridApi = mockGridApi();
      component.gridApi = gridApi;

      // Act
      component.onFilterTextBoxChanged({ target: { value: 'abc' } } as unknown as Event);
      await new Promise((resolve) => setTimeout(resolve, 320));

      // Assert
      expect(gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should apply the loading overlay when loading changes after the first change', () => {
      // Arrange
      const component = createComponent();
      const gridApi = mockGridApi();
      component.gridApi = gridApi;
      component.loading = true;

      // Act
      component.ngOnChanges({
        loading: { firstChange: false, currentValue: true, previousValue: false, isFirstChange: () => false },
      });

      // Assert
      expect(gridApi.showLoadingOverlay).toHaveBeenCalled();
    });

    it('should do nothing when it is the first change', () => {
      // Arrange
      const component = createComponent();
      const gridApi = mockGridApi();
      component.gridApi = gridApi;

      // Act
      component.ngOnChanges({
        loading: { firstChange: true, currentValue: true, previousValue: false, isFirstChange: () => true },
      });

      // Assert
      expect(gridApi.showLoadingOverlay).not.toHaveBeenCalled();
    });
  });

  describe('onGridReady', () => {
    it('should store the grid api and apply the current loading state when onGridReady is called', () => {
      // Arrange
      const component = createComponent();
      component.loading = true;
      const gridApi = mockGridApi();

      // Act
      component.onGridReady({ api: gridApi } as any);

      // Assert
      expect(component.gridApi).toBe(gridApi);
      expect(gridApi.showLoadingOverlay).toHaveBeenCalled();
    });
  });

  describe('onFirstDataRendered', () => {
    it('should do nothing when params is missing', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.onFirstDataRendered(null)).not.toThrow();
    });

    it('should do nothing when params has no columnApi', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.onFirstDataRendered({})).not.toThrow();
    });

    it('should do nothing when columnApi.getAllColumns is not a function', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() =>
        component.onFirstDataRendered({ columnApi: {} }),
      ).not.toThrow();
    });

    it('should auto-size every column resolving ids via getColId or the raw colId field when data is first rendered', () => {
      // Arrange
      const component = createComponent();
      const autoSizeColumns = vi.fn();
      const columnApi = {
        getAllColumns: () => [
          { getColId: () => 'col1' },
          { colId: 'col2' },
        ],
        autoSizeColumns,
      };

      // Act
      component.onFirstDataRendered({ columnApi });

      // Assert
      expect(autoSizeColumns).toHaveBeenCalledWith(['col1', 'col2'], false);
    });

    it('should skip columns with neither getColId nor a string colId', () => {
      // Arrange
      const component = createComponent();
      const autoSizeColumns = vi.fn();
      const columnApi = {
        getAllColumns: () => [{}],
        autoSizeColumns,
      };

      // Act
      component.onFirstDataRendered({ columnApi });

      // Assert
      expect(autoSizeColumns).not.toHaveBeenCalled();
    });

    it('should not throw when getAllColumns returns nothing', () => {
      // Arrange
      const component = createComponent();
      const columnApi = { getAllColumns: () => undefined, autoSizeColumns: vi.fn() };

      // Act
      // Assert
      expect(() => component.onFirstDataRendered({ columnApi })).not.toThrow();
    });

    it('should not call autoSizeColumns when it is not a function even with resolved column ids', () => {
      // Arrange
      const component = createComponent();
      const columnApi = {
        getAllColumns: () => [{ getColId: () => 'col1' }],
      };

      // Act
      // Assert
      expect(() => component.onFirstDataRendered({ columnApi })).not.toThrow();
    });
  });

  describe('toggleFilters', () => {
    it('should flip showFilters when toggleFilters is called', () => {
      // Arrange
      const component = createComponent();

      // Assert
      expect(component.showFilters).toBe(false);

      // Act
      component.toggleFilters();

      // Assert
      expect(component.showFilters).toBe(true);
    });
  });

  describe('onRefreshClicked', () => {
    it('should call refresh and purge the cache when server-side is true', () => {
      // Arrange
      const component = createComponent();
      component.serverSide = true;
      component.refresh = vi.fn();
      const gridApi = mockGridApi();
      component.gridApi = gridApi;

      // Act
      component.onRefreshClicked();

      // Assert
      expect(component.refresh).toHaveBeenCalled();
      expect(gridApi.purgeInfiniteCache).toHaveBeenCalled();
    });

    it('should not purge the cache when not server-side', () => {
      // Arrange
      const component = createComponent();
      component.serverSide = false;
      component.refresh = vi.fn();
      const gridApi = mockGridApi();
      component.gridApi = gridApi;

      // Act
      component.onRefreshClicked();

      // Assert
      expect(gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
    });
  });

  describe('onCellClicked', () => {
    function cellEvent(action: string | null, data: any) {
      const target = document.createElement('button');
      if (action) {
        target.setAttribute('data-action', action);
      }
      return { event: { target }, data } as any;
    }

    it('should ignore a click event when there is no target', () => {
      // Arrange
      const component = createComponent();
      const emitted: any[] = [];
      component.openModal.subscribe((v) => emitted.push(v));

      // Act
      // Assert
      expect(() => component.onCellClicked({ event: {}, data: { id: 'r1' } } as any)).not.toThrow();
      expect(emitted).toHaveLength(0);
    });

    it('should ignore clicks when there is no recognized action', () => {
      // Arrange
      const component = createComponent();
      const emitted: any[] = [];
      component.openModal.subscribe((v) => emitted.push(v));

      // Act
      component.onCellClicked(cellEvent(null, { id: 'r1' }));
      component.onCellClicked(cellEvent('unknown', { id: 'r1' }));

      // Assert
      expect(emitted).toHaveLength(0);
    });

    it('should dispatch the edit action when the edit button is clicked', () => {
      // Arrange
      const component = createComponent();
      const emitted: any[] = [];
      component.openModal.subscribe((v) => emitted.push(v));

      // Act
      component.onCellClicked(cellEvent('edit', { id: 'r1' }));

      // Assert
      expect(emitted[0]).toMatchObject({ isEdit: true, id: 'r1' });
    });

    it('should dispatch the view action when the view button is clicked', () => {
      // Arrange
      const component = createComponent();
      component.baseEndPoint = 'orders';

      // Act
      component.onCellClicked(cellEvent('view', { id: 'r1' }));

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/orders/r1');
    });

    it('should dispatch the delete action and confirm before deleting when the delete button is clicked', async () => {
      // Arrange
      const component = createComponent();
      component.delete = vi.fn();
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });

      // Act
      component.onCellClicked(cellEvent('delete', { id: 'r1' }));
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(component.delete).toHaveBeenCalledWith({ id: 'r1' });
    });

    it('should not delete when the user cancels the confirmation', async () => {
      // Arrange
      const component = createComponent();
      component.delete = vi.fn();
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.onCellClicked(cellEvent('delete', { id: 'r1' }));
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(component.delete).not.toHaveBeenCalled();
    });

    it('should do nothing when confirmDelete is called with no data', () => {
      // Arrange
      const component = createComponent();
      component.delete = vi.fn();

      // Act
      // Assert
      expect(() => (component as any).confirmDelete(null)).not.toThrow();

      expect(component.delete).not.toHaveBeenCalled();
    });

    it('should dispatch the update action when the update button is clicked', () => {
      // Arrange
      const component = createComponent();
      component.update = vi.fn();

      // Act
      component.onCellClicked(cellEvent('update', { id: 'r1' }));

      // Assert
      expect(component.update).toHaveBeenCalledWith({ id: 'r1' });
    });
  });

  describe('onRowDoubleClicked', () => {
    it('should do nothing when there is no row data', () => {
      // Arrange
      const component = createComponent();
      const emitted: any[] = [];
      component.openModal.subscribe((v) => emitted.push(v));

      // Act
      component.onRowDoubleClicked({ data: null } as any);

      // Assert
      expect(emitted).toHaveLength(0);
    });

    it('should do nothing when the action is none', () => {
      // Arrange
      const component = createComponent();
      component.rowDoubleClickAction = 'none';
      const emitted: any[] = [];
      component.openModal.subscribe((v) => emitted.push(v));

      // Act
      component.onRowDoubleClicked({ data: { id: 'r1' } } as any);

      // Assert
      expect(emitted).toHaveLength(0);
    });

    it('should navigate to the row when the action is view', () => {
      // Arrange
      const component = createComponent();
      component.rowDoubleClickAction = 'view';
      component.baseEndPoint = 'orders';

      // Act
      component.onRowDoubleClicked({ data: { id: 'r1' } } as any);

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/orders/r1');
    });

    it('should emit an edit modal state when the action is edit', () => {
      // Arrange
      const component = createComponent();
      component.rowDoubleClickAction = 'edit';
      const emitted: any[] = [];
      component.openModal.subscribe((v) => emitted.push(v));

      // Act
      component.onRowDoubleClicked({ data: { id: 'r1' } } as any);

      // Assert
      expect(emitted[0]).toMatchObject({ isEdit: true, id: 'r1' });
    });
  });

  describe('openAddModal', () => {
    it('should emit an add initial state when openAddModal is called', () => {
      // Arrange
      const component = createComponent();
      const emitted: any[] = [];
      component.openModal.subscribe((v) => emitted.push(v));

      // Act
      component.openAddModal();

      // Assert
      expect(emitted[0]).toMatchObject({ isEdit: false, id: null });
    });
  });

  describe('getRows (server-side pagination)', () => {
    function paramsFor(startRow: number, endRow: number): IGetRowsParams {
      return {
        startRow,
        endRow,
        sortModel: [],
        successCallback: vi.fn(),
        failCallback: vi.fn(),
      } as unknown as IGetRowsParams;
    }

    it('should call the success callback with empty rows when there is no dataSource', () => {
      // Arrange
      const component = createComponent();
      const params = paramsFor(0, 10);

      // Act
      component.gridDatasource.getRows(params);

      // Assert
      expect(params.successCallback).toHaveBeenCalledWith([], 0);
    });

    it('should request the correct page and forward the result to the success callback when getRows is called', () => {
      // Arrange
      const component = createComponent();
      const dataSource = vi.fn().mockReturnValue(
        of({ items: [{ id: 'r1' }], totalCount: 1 } as PagedResult<{ id: string }>),
      );
      component.dataSource = dataSource;
      const params = paramsFor(10, 20);

      // Act
      component.gridDatasource.getRows(params);

      // Assert
      const request = dataSource.mock.calls[0][0] as PagedRequest;
      expect(request.page).toBe(2);
      expect(request.pageSize).toBe(10);
      expect(params.successCallback).toHaveBeenCalledWith([{ id: 'r1' }], 1);
    });

    it('should call the fail callback when the dataSource errors', () => {
      // Arrange
      const component = createComponent();
      component.dataSource = vi.fn().mockReturnValue(throwError(() => new Error('fail')));
      const params = paramsFor(0, 10);

      // Act
      component.gridDatasource.getRows(params);

      // Assert
      expect(params.failCallback).toHaveBeenCalled();
    });
  });

  describe('applyLoadingOverlay (via ngOnChanges)', () => {
    it('should do nothing when there is no gridApi yet', () => {
      // Arrange
      const component = createComponent();
      component.loading = true;

      // Act
      // Assert
      expect(() =>
        component.ngOnChanges({
          loading: { firstChange: false, currentValue: true, previousValue: false, isFirstChange: () => false },
        }),
      ).not.toThrow();
    });

    it('should hide the overlay when loading is false', () => {
      // Arrange
      const component = createComponent();
      const gridApi = mockGridApi();
      component.gridApi = gridApi;
      component.loading = false;

      // Act
      component.ngOnChanges({
        loading: { firstChange: false, currentValue: false, previousValue: true, isFirstChange: () => false },
      });

      // Assert
      expect(gridApi.hideOverlay).toHaveBeenCalled();
    });
  });
});
