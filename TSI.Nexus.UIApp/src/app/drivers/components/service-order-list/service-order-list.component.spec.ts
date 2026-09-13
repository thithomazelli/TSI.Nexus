import {
  Commission,
  CommissionService,
  CommissionStatus,
  NotificationService,
  ServiceOrder,
  ServiceOrderService,
  TranslationService,
} from '@nexus/core';
import { Subject, of, throwError } from 'rxjs';
import { ServiceOrderListComponent } from './service-order-list.component';

describe('ServiceOrderListComponent', () => {
  let commissionServiceMock: { update: ReturnType<typeof vi.fn> };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let serviceOrderServiceMock: { getByDriver: ReturnType<typeof vi.fn> };
  let language$: Subject<string>;
  let translationServiceMock: {
    instant: ReturnType<typeof vi.fn>;
    language$: Subject<string>;
  };

  function createComponent(): ServiceOrderListComponent {
    commissionServiceMock = { update: vi.fn() };
    notificationServiceMock = { showMessage: vi.fn() };
    serviceOrderServiceMock = { getByDriver: vi.fn().mockReturnValue(of({ data: [] })) };
    language$ = new Subject();
    translationServiceMock = { instant: vi.fn((key: string) => key), language$ };

    return new ServiceOrderListComponent(
      commissionServiceMock as unknown as CommissionService,
      notificationServiceMock as unknown as NotificationService,
      serviceOrderServiceMock as unknown as ServiceOrderService,
      translationServiceMock as unknown as TranslationService,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should build the column defs and load the service orders when ngOnInit is called', () => {
      // Arrange
      const component = createComponent();
      component.driverId = 'd1';

      // Act
      component.ngOnInit();

      // Assert
      expect(component.columnDefs.length).toBeGreaterThan(0);
      expect(serviceOrderServiceMock.getByDriver).toHaveBeenCalledWith('d1');
    });

    it('should rebuild the column defs when the language changes', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const before = component.columnDefs;

      // Act
      language$.next('en');

      // Assert
      expect(component.columnDefs).not.toBe(before);
    });
  });

  describe('ngOnChanges', () => {
    it('should reload when driverId changes after the first change', () => {
      // Arrange
      const component = createComponent();
      component.driverId = 'd2';

      // Act
      component.ngOnChanges({ driverId: { firstChange: false } as any });

      // Assert
      expect(serviceOrderServiceMock.getByDriver).toHaveBeenCalledWith('d2');
    });

    it('should not reload when it is the first change', () => {
      // Arrange
      const component = createComponent();
      component.driverId = 'd2';

      // Act
      component.ngOnChanges({ driverId: { firstChange: true } as any });

      // Assert
      expect(serviceOrderServiceMock.getByDriver).not.toHaveBeenCalled();
    });

    it('should do nothing when driverId is not part of the change set', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnChanges({})).not.toThrow();
      expect(serviceOrderServiceMock.getByDriver).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop reacting to language changes when the component is destroyed', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.ngOnDestroy();
      const before = component.columnDefs;

      // Act
      language$.next('en');

      // Assert
      expect(component.columnDefs).toBe(before);
    });
  });

  describe('refresh', () => {
    it('should reload and show the response notification when refresh is called', () => {
      // Arrange
      const component = createComponent();
      component.driverId = 'd1';
      serviceOrderServiceMock.getByDriver.mockReturnValue(
        of({ status: 'Success', message: 'Atualizado', data: [] }),
      );

      // Act
      component.refresh();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Success', 'Atualizado');
    });
  });

  describe('noop', () => {
    it('should do nothing when noop is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.noop()).not.toThrow();
    });
  });

  describe('markAsPaid', () => {
    it('should do nothing when the service order has no commission', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.markAsPaid({ id: 'so1' } as ServiceOrder);

      // Assert
      expect(commissionServiceMock.update).not.toHaveBeenCalled();
    });

    it('should update the commission to Paid and reload when markAsPaid is called', () => {
      // Arrange
      const component = createComponent();
      component.driverId = 'd1';
      const serviceOrder = {
        id: 'so1',
        commission: { id: 'c1', status: CommissionStatus.Pending } as Commission,
      } as ServiceOrder;
      commissionServiceMock.update.mockReturnValue(
        of({ status: 'Success', message: 'Pago' }),
      );

      // Act
      component.markAsPaid(serviceOrder);

      // Assert
      expect(commissionServiceMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'c1', status: CommissionStatus.Paid }),
      );
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Success', 'Pago');
      expect(serviceOrderServiceMock.getByDriver).toHaveBeenCalledWith('d1');
    });
  });

  describe('load (private, via ngOnInit)', () => {
    it('should do nothing when there is no driverId', () => {
      // Arrange
      const component = createComponent();
      component.driverId = '' as any;

      // Act
      component.ngOnInit();

      // Assert
      expect(serviceOrderServiceMock.getByDriver).not.toHaveBeenCalled();
      expect(component.loading).toBe(false);
    });

    it('should fall back to an empty array when the response has no data', () => {
      // Arrange
      const component = createComponent();
      component.driverId = 'd1';
      serviceOrderServiceMock.getByDriver.mockReturnValue(of({}));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.rowData).toEqual([]);
      expect(component.loading).toBe(false);
    });

    it('should stop loading without throwing when the request errors', () => {
      // Arrange
      const component = createComponent();
      component.driverId = 'd1';
      serviceOrderServiceMock.getByDriver.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.loading).toBe(false);
    });
  });

  describe('column defs cell renderers', () => {
    it('should format issueDate as a BR date', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'issueDate')!;

      // Act
      // Assert
      expect((column.valueFormatter as (p: any) => string)({ value: '2024-01-15' } as any)).toContain(
        '/',
      );
    });

    it('should format commission.baseAmount and commission.amount as BRL currency', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const baseColumn = component.columnDefs.find((c) => c.field === 'commission.baseAmount')!;
      const amountColumn = component.columnDefs.find((c) => c.field === 'commission.amount')!;

      // Act
      // Assert
      expect((baseColumn.valueFormatter as (p: any) => string)({ value: 100 } as any)).toContain('R$');
      expect((amountColumn.valueFormatter as (p: any) => string)({ value: 50 } as any)).toContain('R$');
    });

    it('should format commission.percentage with a % suffix and fall back to an empty string when there is no value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const column = component.columnDefs.find((c) => c.field === 'commission.percentage')!;

      // Act
      // Assert
      expect((column.valueFormatter as (p: any) => string)({ value: 10 } as any)).toBe('10%');
      expect((column.valueFormatter as (p: any) => string)({ value: null } as any)).toBe('');
    });

    describe('commission.status column', () => {
      it('should render an empty string when there is no status', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.find((c) => c.field === 'commission.status')!;

        // Act
        // Assert
        expect((column.cellRenderer as (p: any) => string)({ value: null })).toBe('');
      });

      it.each([
        ['Pending', 'warning', 'DRIVERS.COMMISSION_STATUS_PENDING'],
        ['Paid', 'success', 'DRIVERS.COMMISSION_STATUS_PAID'],
        ['Cancelled', 'secondary', 'DRIVERS.COMMISSION_STATUS_CANCELLED'],
      ])('should render status %s with the %s color and translated label when the commission has that status', (status, color, label) => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.find((c) => c.field === 'commission.status')!;

        // Act
        const html = (column.cellRenderer as (p: any) => string)({ value: status });

        // Assert
        expect(html).toContain(`bg-${color}`);
        expect(html).toContain(label);
      });

      it('should fall back to a secondary badge with the raw value when the status is unknown', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs.find((c) => c.field === 'commission.status')!;

        // Act
        const html = (column.cellRenderer as (p: any) => string)({ value: 'Unknown' });

        // Assert
        expect(html).toContain('bg-secondary');
        expect(html).toContain('Unknown');
      });
    });

    describe('actions column', () => {
      it('should render nothing when the commission is not Pending', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs[component.columnDefs.length - 1];

        // Act
        const html = (column.cellRenderer as (p: any) => string)({
          data: { commission: { status: CommissionStatus.Paid } },
        });

        // Assert
        expect(html).toBe('');
      });

      it('should render nothing when there is no commission at all', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs[component.columnDefs.length - 1];

        // Act
        const html = (column.cellRenderer as (p: any) => string)({ data: {} });

        // Assert
        expect(html).toBe('');
      });

      it('should render the pay button when the commission is Pending', () => {
        // Arrange
        const component = createComponent();
        component.ngOnInit();
        const column = component.columnDefs[component.columnDefs.length - 1];

        // Act
        const html = (column.cellRenderer as (p: any) => string)({
          data: { commission: { status: CommissionStatus.Pending } },
        });

        // Assert
        expect(html).toContain('data-action="update"');
        expect(html).toContain('DRIVERS.PAY_BUTTON');
      });
    });
  });
});
