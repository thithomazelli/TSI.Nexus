import {
  ModalService,
  NotificationService,
  PhotoService,
  ResponseStatus,
  TranslationService,
  User,
  UserService,
} from '@nexus/core';
import { GridApi } from 'ag-grid-community';
import { Observable, Subject, of } from 'rxjs';
import { UsersComponent } from './users.component';
import { GridComponent } from '../shared/grid/grid.component';

describe('UsersComponent', () => {
  let modalServiceMock: {
    showTemplateModal: ReturnType<typeof vi.fn>;
    hideModal: ReturnType<typeof vi.fn>;
    showSweetNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let userChanged$: Subject<void>;
  let userServiceMock: {
    getAllPaged: ReturnType<typeof vi.fn>;
    userChanged$: Subject<void>;
    delete: ReturnType<typeof vi.fn>;
    refresh: ReturnType<typeof vi.fn>;
  };
  let photoServiceMock: { getPhoto: ReturnType<typeof vi.fn> };
  let language$: Subject<string>;
  let translationServiceMock: {
    instant: ReturnType<typeof vi.fn>;
    language$: Subject<string>;
  };

  function createComponent(): UsersComponent {
    modalServiceMock = {
      showTemplateModal: vi.fn(),
      hideModal: vi.fn(),
      showSweetNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    userChanged$ = new Subject();
    userServiceMock = {
      getAllPaged: vi.fn(),
      userChanged$,
      delete: vi.fn(),
      refresh: vi.fn(),
    };
    photoServiceMock = { getPhoto: vi.fn().mockReturnValue(of(new Blob())) };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };

    return new UsersComponent(
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      userServiceMock as unknown as UserService,
      photoServiceMock as unknown as PhotoService,
      translationServiceMock as unknown as TranslationService,
    );
  }

  function mockGridRef(): GridComponent<User> {
    return {
      gridApi: { purgeInfiniteCache: vi.fn() } as unknown as GridApi,
    } as unknown as GridComponent<User>;
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  it('should build the column definitions when constructed', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component.columnDefs.length).toBeGreaterThan(0);
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

  describe('ngOnInit / userChanged$', () => {
    it('should ignore the first replay emission but purge the cache when later changes occur', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();

      // Act
      userChanged$.next();
      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();

      // Act
      userChanged$.next();
      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalledTimes(1);
    });

    it('should stop reacting to userChanged$ when ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      component.ngOnInit();
      component.ngOnDestroy();

      // Act
      userChanged$.next();
      userChanged$.next();

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
    });

    it('should not throw when ngOnDestroy is called before ngOnInit', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('pagedDataSource', () => {
    it('should delegate to userService.getAllPaged when pagedDataSource is called', () => {
      // Arrange
      const component = createComponent();
      const request = { page: 1, pageSize: 10 } as never;
      userServiceMock.getAllPaged.mockReturnValue(of({ items: [] }));

      // Act
      component.pagedDataSource(request);

      // Assert
      expect(userServiceMock.getAllPaged).toHaveBeenCalledWith(request);
    });
  });

  describe('openModal', () => {
    it('should open the user details modal when openModal is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.openModal({ isEdit: false });

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        expect.anything(),
        { isEdit: false },
      );
    });
  });

  describe('deleteUser', () => {
    it('should purge the grid cache and notify when the delete succeeds', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      userServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Removido' }),
      );

      // Act
      component.deleteUser({ id: 'u1' } as User);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).toHaveBeenCalled();
      expect(modalServiceMock.hideModal).toHaveBeenCalled();
      expect(modalServiceMock.showSweetNotification).toHaveBeenCalledWith(
        '',
        'Removido',
        ResponseStatus.Success,
      );
    });

    it('should not purge the cache when the delete reports an error', () => {
      // Arrange
      const component = createComponent();
      const gridRef = mockGridRef();
      (component as any).gridRef = gridRef;
      userServiceMock.delete.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou' }),
      );

      // Act
      component.deleteUser({ id: 'u1' } as User);

      // Assert
      expect(gridRef.gridApi.purgeInfiniteCache).not.toHaveBeenCalled();
    });
  });

  describe('refreshUsers', () => {
    it('should refresh the shared cache and show a notification when refreshUsers is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.refreshUsers();

      // Assert
      expect(userServiceMock.refresh).toHaveBeenCalled();
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'USERS.USERS_REFRESHED',
      );
    });
  });

  describe('onImgError', () => {
    it('should fall back to the default profile image when onImgError is called', () => {
      // Arrange
      const component = createComponent();
      const img = document.createElement('img');

      // Act
      component.onImgError({ target: img } as unknown as Event);

      // Assert
      expect(img.src).toContain('assets/img/no_profile.png');
    });
  });

  describe('role column cell renderer', () => {
    it('should map a known role to its translated label when the role is recognized', () => {
      // Arrange
      const component = createComponent();
      const roleColumn = component.columnDefs.find((c) => c.field === 'role')!;

      // Act
      const result = (roleColumn.cellRenderer as (params: any) => string)({
        data: { role: 'Admin' },
      });

      // Assert
      expect(result).toBe('USERS.ROLE_ADMIN');
    });

    it('should fall back to the raw role value when the role is unmapped', () => {
      // Arrange
      const component = createComponent();
      const roleColumn = component.columnDefs.find((c) => c.field === 'role')!;

      // Act
      const result = (roleColumn.cellRenderer as (params: any) => string)({
        data: { role: 'Custom' },
      });

      // Assert
      expect(result).toBe('Custom');
    });

    it('should fall back to an empty string when there is no role at all', () => {
      // Arrange
      const component = createComponent();
      const roleColumn = component.columnDefs.find((c) => c.field === 'role')!;

      // Act
      const result = (roleColumn.cellRenderer as (params: any) => string)({
        data: { role: undefined },
      });

      // Assert
      expect(result).toBe('');
    });
  });

  describe('fullName column cell renderer', () => {
    it('should not throw when rendering a placeholder row with no data (ag-Grid infinite scroll)', () => {
      // Arrange
      const component = createComponent();
      const fullNameColumn = component.columnDefs.find((c) => c.colId === 'fullName')!;

      // Act
      // Assert
      expect(() =>
        (fullNameColumn.cellRenderer as (params: any) => string)({ value: '', data: undefined }),
      ).not.toThrow();
    });

    it('should link to the user details page when data is available', () => {
      // Arrange
      const component = createComponent();
      const fullNameColumn = component.columnDefs.find((c) => c.colId === 'fullName')!;

      // Act
      const html = (fullNameColumn.cellRenderer as (params: any) => string)({
        value: 'Ana Silva',
        data: { id: 'u1' },
      });

      // Assert
      expect(html).toContain(`/${component.baseEndPoint}/u1`);
      expect(html).toContain('Ana Silva');
    });

    it('should render an empty label when the cell value is null or undefined', () => {
      // Arrange
      const component = createComponent();
      const fullNameColumn = component.columnDefs.find((c) => c.colId === 'fullName')!;

      // Act
      const html = (fullNameColumn.cellRenderer as (params: any) => string)({
        value: null,
        data: { id: 'u1' },
      });

      // Assert
      expect(html).toContain('></a>');
    });

    it('should compose firstName and lastName via the valueGetter, falling back per field when a name part is missing', () => {
      // Arrange
      const component = createComponent();
      const fullNameColumn = component.columnDefs.find((c) => c.colId === 'fullName')!;
      const valueGetter = fullNameColumn.valueGetter as (params: any) => string;

      // Act
      // Assert
      expect(valueGetter({ data: { firstName: 'Ana', lastName: 'Silva' } })).toBe('Ana Silva');
      expect(valueGetter({ data: { firstName: 'Ana' } })).toBe('Ana');
      expect(valueGetter({ data: { lastName: 'Silva' } })).toBe('Silva');
      expect(valueGetter({ data: undefined })).toBe('');
    });
  });

  describe('actions column cell renderer', () => {
    it('should render view, edit, and delete action buttons when the cellRenderer is invoked', () => {
      // Arrange
      const component = createComponent();
      const actionsColumn = component.columnDefs.find(
        (c) => c.headerName === 'COMMON.ACTIONS',
      )!;

      // Act
      const html = (actionsColumn.cellRenderer as () => string)();

      // Assert
      expect(html).toContain('data-action="view"');
      expect(html).toContain('data-action="edit"');
      expect(html).toContain('data-action="delete"');
    });
  });

  describe('photo column cell renderer', () => {
    it('should fetch the photo when an attachment id is present', () => {
      // Arrange
      const component = createComponent();
      const photoColumn = component.columnDefs.find((c) => c.field === 'photo')!;

      // Act
      const container = (photoColumn.cellRenderer as (params: any) => HTMLElement)({
        value: 'att-1',
        data: { id: 'u1' },
      });

      // Assert
      expect(container).toBeInstanceOf(HTMLElement);
      expect(photoServiceMock.getPhoto).toHaveBeenCalledWith('Users', 'u1', 'att-1');
    });

    it('should keep the fallback icon visible when the photo request errors', () => {
      // Arrange
      const component = createComponent();
      photoServiceMock.getPhoto.mockReturnValue(
        new Observable((subscriber) => subscriber.error(new Error('boom'))),
      );
      const photoColumn = component.columnDefs.find((c) => c.field === 'photo')!;

      // Act
      // Assert
      expect(() =>
        (photoColumn.cellRenderer as (params: any) => HTMLElement)({
          value: 'att-1',
          data: { id: 'u1' },
        }),
      ).not.toThrow();
    });

    it('should not fetch a photo when there is no attachment id', () => {
      // Arrange
      const component = createComponent();
      const photoColumn = component.columnDefs.find((c) => c.field === 'photo')!;

      // Act
      (photoColumn.cellRenderer as (params: any) => HTMLElement)({
        value: null,
        data: { id: 'u1' },
      });

      // Assert
      expect(photoServiceMock.getPhoto).not.toHaveBeenCalled();
    });
  });
});
