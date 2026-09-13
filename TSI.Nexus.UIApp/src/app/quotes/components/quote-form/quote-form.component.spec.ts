import { ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
  BusinessPartner,
  BusinessPartnerService,
  Driver,
  DriverService,
  ModalService,
  NotificationService,
  PaymentCondition,
  PaymentMethod,
  Quote,
  QuoteProduct,
  QuoteProductService,
  QuoteService,
  QuoteStatus,
  QuoteType,
  ResponseStatus,
  TranslationService,
  Vehicle,
  VehicleService,
  WebApiResponse,
} from '@nexus/core';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { Subject, config, of, throwError } from 'rxjs';
import { BusinessPartnerDetailsModalComponent } from '../../../business-partner/components/business-partner-details-modal/business-partner-details-modal.component';
import { QuoteProductDetailsModalComponent } from '../../../quote-products/components/quote-product-details-modal/quote-product-details-modal.component';
import { QuoteDetailsModalComponent } from '../quote-details-modal/quote-details-modal.component';
import { QuoteFormComponent } from './quote-form.component';

describe('QuoteFormComponent', () => {
  let businessPartnerServiceMock: {
    getClients: ReturnType<typeof vi.fn>;
    addOrUpdateBusinessPartner: ReturnType<typeof vi.fn>;
  };
  let driverServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let modalServiceMock: {
    hideModal: ReturnType<typeof vi.fn>;
    showConfirmation: ReturnType<typeof vi.fn>;
    showTemplateModal: ReturnType<typeof vi.fn>;
    showNotification: ReturnType<typeof vi.fn>;
  };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let quoteServiceMock: {
    add: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    convertToOrder: ReturnType<typeof vi.fn>;
    convertToTrip: ReturnType<typeof vi.fn>;
  };
  let quoteProductAdded$: Subject<QuoteProduct | null>;
  let quoteProductServiceMock: { quoteProductAdded$: Subject<QuoteProduct | null> };
  let vehicleServiceMock: { getAll: ReturnType<typeof vi.fn> };
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };

  const businessPartners: BusinessPartner[] = [
    { id: 'bp1', name: 'Cliente A' } as BusinessPartner,
    { id: 'bp2', name: 'Cliente B' } as BusinessPartner,
  ];

  const vehicles: Vehicle[] = [
    { id: 'v1', plate: 'ABC1234', brand: 'Marca', model: 'Modelo' } as Vehicle,
    { id: 'v2', plate: 'XYZ9999', brand: 'Outra', model: 'Outro' } as Vehicle,
  ];

  const drivers: Driver[] = [
    { id: 'd1', name: 'João' } as Driver,
    { id: 'd2', name: 'Maria' } as Driver,
  ];

  function createComponent(): QuoteFormComponent {
    businessPartnerServiceMock = {
      getClients: vi.fn().mockReturnValue(of({ data: businessPartners } as WebApiResponse<BusinessPartner[]>)),
      addOrUpdateBusinessPartner: vi.fn(),
    };
    driverServiceMock = { getAll: vi.fn().mockReturnValue(of({ data: drivers } as WebApiResponse<Driver[]>)) };
    modalServiceMock = {
      hideModal: vi.fn(),
      showConfirmation: vi.fn(),
      showTemplateModal: vi.fn(),
      showNotification: vi.fn(),
    };
    notificationServiceMock = { showMessage: vi.fn() };
    quoteServiceMock = {
      add: vi.fn(),
      update: vi.fn(),
      convertToOrder: vi.fn(),
      convertToTrip: vi.fn(),
    };
    quoteProductAdded$ = new Subject();
    quoteProductServiceMock = { quoteProductAdded$ };
    vehicleServiceMock = { getAll: vi.fn().mockReturnValue(of({ data: vehicles } as WebApiResponse<Vehicle[]>)) };
    routerMock = { navigateByUrl: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };
    dialogRefMock = { close: vi.fn() };

    const component = new QuoteFormComponent(
      businessPartnerServiceMock as unknown as BusinessPartnerService,
      driverServiceMock as unknown as DriverService,
      new FormBuilder(),
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      quoteServiceMock as unknown as QuoteService,
      quoteProductServiceMock as unknown as QuoteProductService,
      vehicleServiceMock as unknown as VehicleService,
      routerMock as unknown as Router,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
    component.dialogRef = dialogRefMock as unknown as MatDialogRef<any>;
    component.data = { quoteProducts: [] } as unknown as Quote;
    return component;
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent()).toBeTruthy();
  });

  describe('quoteStatusOptions / methodOptions / conditionOptions / trackByOptionValue', () => {
    it('should expose translated status options when the component is instantiated', () => {
      // Act
      const component = createComponent();

      // Assert
      expect(component.quoteStatusOptions.length).toBe(4);
    });

    it('should expose translated method options when the component is instantiated', () => {
      // Act
      const component = createComponent();

      // Assert
      expect(component.methodOptions.length).toBe(3);
    });

    it('should expose translated condition options when the component is instantiated', () => {
      // Act
      const component = createComponent();

      // Assert
      expect(component.conditionOptions.length).toBe(2);
    });

    it('should return the option value when trackByOptionValue is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.trackByOptionValue(0, { value: QuoteStatus.Open, label: 'x' })).toBe(QuoteStatus.Open);
    });
  });

  describe('ngOnInit', () => {
    it('should build the form and load business partners when ngOnInit is called', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('businessPartnerId')).toBeTruthy();
      expect(businessPartnerServiceMock.getClients).toHaveBeenCalled();
    });

    it('should not load vehicles or drivers when the quote is not a trip', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(vehicleServiceMock.getAll).not.toHaveBeenCalled();
      expect(driverServiceMock.getAll).not.toHaveBeenCalled();
    });

    it('should load vehicles and drivers and add the quoteTrip group when the quote is a trip', () => {
      // Arrange
      const component = createComponent();
      component.data = { quoteProducts: [], type: QuoteType.Trip } as unknown as Quote;

      // Act
      component.ngOnInit();

      // Assert
      expect(vehicleServiceMock.getAll).toHaveBeenCalled();
      expect(driverServiceMock.getAll).toHaveBeenCalled();
      expect(component.form.get('quoteTrip')).toBeTruthy();
      expect(component.vehicles).toEqual(vehicles);
      expect(component.drivers).toEqual(drivers);
    });

    it('should fall back to empty arrays when vehicle and driver responses have no data', () => {
      // Arrange
      const component = createComponent();
      component.data = { quoteProducts: [], type: QuoteType.Trip } as unknown as Quote;
      vehicleServiceMock.getAll.mockReturnValue(of({} as WebApiResponse<Vehicle[]>));
      driverServiceMock.getAll.mockReturnValue(of({} as WebApiResponse<Driver[]>));

      // Act
      component.ngOnInit();

      // Assert
      expect(component.vehicles).toEqual([]);
      expect(component.drivers).toEqual([]);
    });

    // this.form.disable() cascades depth-first: it disables 'totalPrice' before
    // 'paymentTotalPrice', and disabling a control still emits its valueChanges (Angular does not
    // suppress that during disable()). setupPaymentPriceWatcher()'s subscriber reacts to that
    // emission by calling paymentTotalPrice.setValue(...), which (default emitEvent/onlySelf)
    // recalculates the ancestor FormGroup's status from its still-partially-enabled children
    // mid-cascade - clobbering the DISABLED status the top-level disable() had just set, before
    // the remaining children even get disabled. The net effect: every individual control ends up
    // disabled, but the group's own aggregate `disabled` getter reports false. Documented as a
    // genuine (if inert - form.invalid/getRawValue() still behave, and no visible field is
    // actually editable) pre-existing quirk, not fixed here.
    it('should disable every individual control when the quote is already converted even though the group-level disabled flag is clobbered by a watcher side effect', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { quoteProducts: [], status: QuoteStatus.Converted } as unknown as Quote;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.disabled).toBe(false);
      expect(component.form.get('businessPartnerId')!.disabled).toBe(true);
      expect(component.form.get('totalPrice')!.disabled).toBe(true);
    });

    it('should append a product, recompute totals, and notify when quoteProductAdded$ emits a product', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      const product = { totalPrice: 50 } as QuoteProduct;

      // Act
      quoteProductAdded$.next(product);

      // Assert
      expect(component.data!.quoteProducts).toEqual([product]);
      expect(component.form.get('price')!.value).toBe(50);
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(true, '', 'QUOTES.PRODUCT_ADDED_SUCCESS');
    });

    it('should fall back to an empty array when data has no quoteProducts yet and a product is added', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Quote;
      component.ngOnInit();
      const product = { totalPrice: 0 } as QuoteProduct;

      // Act
      quoteProductAdded$.next(product);

      // Assert
      expect(component.data!.quoteProducts).toEqual([product]);
    });

    it('should ignore quoteProductAdded$ emissions when there is no product or no data', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      quoteProductAdded$.next(null);
      component.data = null;
      quoteProductAdded$.next({ totalPrice: 10 } as QuoteProduct);

      // Assert
      expect(modalServiceMock.showNotification).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should re-patch the form when data changes', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.data = { quoteProducts: [], description: 'Nova' } as unknown as Quote;

      // Act
      component.ngOnChanges({ data: {} as never });

      // Assert
      expect(component.form.get('description')!.value).toBe('Nova');
    });

    it('should add the quoteTrip group and load vehicles and drivers the first time data becomes a trip quote', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      expect(component.form.get('quoteTrip')).toBeNull();

      // Act
      component.data = { quoteProducts: [], type: QuoteType.Trip } as unknown as Quote;
      component.ngOnChanges({ data: {} as never });

      // Assert
      expect(component.form.get('quoteTrip')).toBeTruthy();
      expect(vehicleServiceMock.getAll).toHaveBeenCalled();
    });

    it('should not re-add the quoteTrip group when it already exists', () => {
      // Arrange
      const component = createComponent();
      component.data = { quoteProducts: [], type: QuoteType.Trip } as unknown as Quote;
      component.ngOnInit();
      vehicleServiceMock.getAll.mockClear();

      // Act
      component.data = { quoteProducts: [], type: QuoteType.Trip, description: 'Outra' } as unknown as Quote;
      component.ngOnChanges({ data: {} as never });

      // Assert
      expect(vehicleServiceMock.getAll).not.toHaveBeenCalled();
      expect(component.form.get('description')!.value).toBe('Outra');
    });

    it('should do nothing when the changed input is not data', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      // Assert
      expect(() => component.ngOnChanges({ isEdit: {} as never })).not.toThrow();
    });

    it('should not throw when data changes before the form exists', () => {
      // Arrange
      const component = createComponent();
      component.data = { quoteProducts: [] } as unknown as Quote;

      // Act
      // Assert
      expect(() => component.ngOnChanges({ data: {} as never })).not.toThrow();
    });

    // See the equivalent ngOnInit test above for why the group-level `disabled` flag ends up
    // false even though every individual control is disabled.
    it('should disable every individual control when data changes into a converted status', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.ngOnInit();

      // Act
      component.data = { quoteProducts: [], status: QuoteStatus.Converted } as unknown as Quote;
      component.ngOnChanges({ data: {} as never });

      // Assert
      expect(component.form.disabled).toBe(false);
      expect(component.form.get('businessPartnerId')!.disabled).toBe(true);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe tracked subscriptions when ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should not throw when ngOnDestroy is called with no subscriptions yet', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('submit', () => {
    function fillValidForm(component: QuoteFormComponent) {
      component.form.patchValue({
        businessPartnerId: 'bp1',
        businessPartnerName: 'Cliente A',
        date: new Date(),
        status: QuoteStatus.Open,
      });
    }

    it('should mark the form as touched and return null without saving when the form is invalid', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      let result: unknown;

      // Act
      component.submit().subscribe((r) => (result = r));

      // Assert
      expect(result).toBeNull();
      expect(quoteServiceMock.add).not.toHaveBeenCalled();
    });

    it('should assign the raw form value onto data before saving when submit succeeds', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      quoteServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'q1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(component.data).toMatchObject({ businessPartnerId: 'bp1' });
    });

    it('should not throw when there is no data to assign the raw form value onto', () => {
      // Arrange
      const component = createComponent();
      component.data = null;
      component.ngOnInit();
      fillValidForm(component);
      quoteServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'q1' } }),
      );

      // Act
      // Assert
      expect(() => component.submit().subscribe()).not.toThrow();
    });

    it('should call update instead of add when editing an existing quote', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { id: 'q1', quoteProducts: [] } as unknown as Quote;
      component.ngOnInit();
      fillValidForm(component);
      quoteServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Salvo', data: { id: 'q1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(quoteServiceMock.update).toHaveBeenCalled();
      expect(quoteServiceMock.add).not.toHaveBeenCalled();
    });

    it('should notify without saving when the backend reports a business error', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      quoteServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falhou', data: null }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Error, 'Falhou');
    });

    it('should close the dialog and notify on success when in modal mode', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;
      component.ngOnInit();
      fillValidForm(component);
      quoteServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'q1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalled();
      expect(modalServiceMock.showNotification).toHaveBeenCalledWith(true, 'QUOTES.QUOTE_ADDED', 'OK');
    });

    it('should navigate to the new quote page on success when in page mode', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;
      component.ngOnInit();
      fillValidForm(component);
      quoteServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK', data: { id: 'q1' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/quotes/q1');
    });

    it('should show the message and refresh data when editing in page mode', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.isModal = false;
      component.data = { id: 'q1', quoteProducts: [] } as unknown as Quote;
      component.ngOnInit();
      fillValidForm(component);
      quoteServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Salvo', data: { id: 'q1', description: 'Nova' } }),
      );

      // Act
      component.submit().subscribe();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Success, 'Salvo');
      expect(component.data).toEqual({ id: 'q1', description: 'Nova' });
    });

    it('should notify an error when saving fails', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      fillValidForm(component);
      quoteServiceMock.add.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.submit().subscribe({ error: () => {} });

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Error', 'COMMON.SAVE_ERROR');
    });
  });

  describe('cancel', () => {
    it('should hide the modal when in modal mode', () => {
      // Arrange
      const component = createComponent();
      component.isModal = true;

      // Act
      component.cancel();

      // Assert
      expect(modalServiceMock.hideModal).toHaveBeenCalledWith(dialogRefMock);
    });

    it('should navigate back to the list page when not in modal mode', () => {
      // Arrange
      const component = createComponent();
      component.isModal = false;

      // Act
      component.cancel();

      // Assert
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/quotes');
    });
  });

  describe('isTripQuote', () => {
    it('should return true when the data type is Trip', () => {
      // Arrange
      const component = createComponent();
      component.data = { quoteProducts: [], type: QuoteType.Trip } as unknown as Quote;

      // Act
      // Assert
      expect(component.isTripQuote()).toBe(true);
    });

    it('should return false when the data type is not Trip', () => {
      // Arrange
      const component = createComponent();

      // Act
      // Assert
      expect(component.isTripQuote()).toBe(false);
    });
  });

  describe('convert', () => {
    it('should notify an error and return when there is no data', () => {
      // Arrange
      const component = createComponent();
      component.data = null;

      // Act
      component.convert();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith('Error', 'QUOTES.NOT_FOUND');
      expect(quoteServiceMock.convertToOrder).not.toHaveBeenCalled();
    });

    it('should call convertToTrip when the quote is a trip', () => {
      // Arrange
      const component = createComponent();
      component.data = { quoteProducts: [], type: QuoteType.Trip } as unknown as Quote;
      quoteServiceMock.convertToTrip.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'OK' }),
      );

      // Act
      component.convert();

      // Assert
      expect(quoteServiceMock.convertToTrip).toHaveBeenCalledWith(component.data);
    });

    it('should call convertToOrder and notify on success when the quote is not a trip', () => {
      // Arrange
      const component = createComponent();
      quoteServiceMock.convertToOrder.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Convertido' }),
      );

      // Act
      component.convert();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Success, 'Convertido');
    });

    it('should notify a failure message when the conversion does not succeed', () => {
      // Arrange
      const component = createComponent();
      quoteServiceMock.convertToOrder.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Deu ruim' }),
      );

      // Act
      component.convert();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Error, 'Deu ruim');
    });

    it('should fall back to a translated message when the conversion failure has no message', () => {
      // Arrange
      const component = createComponent();
      quoteServiceMock.convertToOrder.mockReturnValue(
        of({ status: ResponseStatus.Error, message: '' }),
      );

      // Act
      component.convert();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Error, 'QUOTES.CONVERT_FAILED');
    });

    it('should notify an error when the conversion request fails', () => {
      // Arrange
      const component = createComponent();
      quoteServiceMock.convertToOrder.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.convert();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Error, 'QUOTES.CONVERT_ERROR');
    });

    it('should show a confirmation and retry convertToOrder when the response is a Warning and the user confirms', () => {
      // Arrange
      const component = createComponent();
      quoteServiceMock.convertToOrder
        .mockReturnValueOnce(of({ status: 'Warning', message: 'Confirma?', data: { id: 'q1' } }))
        .mockReturnValueOnce(of({ status: ResponseStatus.Success, message: 'Convertido' }));
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });

      // Act
      component.convert();

      // Assert
      expect(modalServiceMock.showConfirmation).toHaveBeenCalled();
      expect(quoteServiceMock.convertToOrder).toHaveBeenCalledTimes(2);
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Success, 'Convertido');
    });

    it('should notify a failure when the retried convertToOrder does not succeed', () => {
      // Arrange
      const component = createComponent();
      quoteServiceMock.convertToOrder
        .mockReturnValueOnce(of({ status: 'Warning', message: 'Confirma?', data: { id: 'q1' } }))
        .mockReturnValueOnce(of({ status: ResponseStatus.Error, message: 'Falhou de novo' }));
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });

      // Act
      component.convert();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Error, 'Falhou de novo');
    });

    it('should fall back to a translated message when the retried convertToOrder failure has no message', () => {
      // Arrange
      const component = createComponent();
      quoteServiceMock.convertToOrder
        .mockReturnValueOnce(of({ status: 'Warning', message: 'Confirma?', data: { id: 'q1' } }))
        .mockReturnValueOnce(of({ status: ResponseStatus.Error, message: '' }));
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });

      // Act
      component.convert();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Error, 'QUOTES.CONVERT_FAILED');
    });

    it('should notify an error when the retried convertToOrder request fails', () => {
      // Arrange
      const component = createComponent();
      quoteServiceMock.convertToOrder
        .mockReturnValueOnce(of({ status: 'Warning', message: 'Confirma?', data: { id: 'q1' } }))
        .mockReturnValueOnce(throwError(() => new Error('boom')));
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });

      // Act
      component.convert();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(ResponseStatus.Error, 'QUOTES.CONVERT_ERROR');
    });

    it('should do nothing further when the Warning confirmation is declined', () => {
      // Arrange
      const component = createComponent();
      quoteServiceMock.convertToOrder.mockReturnValue(
        of({ status: 'Warning', message: 'Confirma?', data: { id: 'q1' } }),
      );
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.convert();

      // Assert
      expect(quoteServiceMock.convertToOrder).toHaveBeenCalledTimes(1);
    });
  });

  describe('onClientBlur', () => {
    it('should clean the selection when the typed business partner name is blank', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('   ');

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('businessPartnerId')!.value).toBe('');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should do nothing further when the typed name matches an existing business partner', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Cliente A');

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).not.toHaveBeenCalled();
    });

    it('should offer to create a new client when the typed name matches nothing', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Novo Cliente');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(undefined) });

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showConfirmation).toHaveBeenCalled();
    });

    it('should clean the selection when the user declines creating a new business partner', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Novo Cliente');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(false) });

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(modalServiceMock.showTemplateModal).not.toHaveBeenCalled();
      expect(component.form.get('businessPartnerId')!.value).toBe('');
    });

    it('should create and select the new business partner once confirmed', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Novo Cliente');
      const created = { id: 'bp9', name: 'Novo Cliente' } as BusinessPartner;
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(created) });

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(businessPartnerServiceMock.addOrUpdateBusinessPartner).toHaveBeenCalledWith(created);
      expect(component.form.get('businessPartnerId')!.value).toBe('bp9');
      expect(component.form.get('businessPartnerName')!.value).toBe('Novo Cliente');
    });

    it('should clean the selection when the new-partner modal closes without a result', async () => {
      // Arrange
      vi.useFakeTimers();
      const component = createComponent();
      component.ngOnInit();
      component.form.get('businessPartnerName')!.setValue('Novo Cliente');
      modalServiceMock.showConfirmation.mockReturnValue({ afterClosed: () => of(true) });
      modalServiceMock.showTemplateModal.mockReturnValue({ afterClosed: () => of(undefined) });

      // Act
      component.onClientBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('businessPartnerId')!.value).toBe('');
    });
  });

  describe('removeProduct', () => {
    it('should do nothing when there are no quoteProducts', () => {
      // Arrange
      const component = createComponent();
      component.data = {} as unknown as Quote;
      component.ngOnInit();

      // Act
      // Assert
      expect(() => component.removeProduct(0)).not.toThrow();
    });

    it('should remove the product at the given index and recompute totals', () => {
      // Arrange
      const component = createComponent();
      component.data = { quoteProducts: [{ totalPrice: 10 }, { totalPrice: 20 }] } as unknown as Quote;
      component.ngOnInit();

      // Act
      component.removeProduct(0);

      // Assert
      expect(component.data!.quoteProducts).toEqual([{ totalPrice: 20 }]);
      expect(component.form.get('price')!.value).toBe(20);
    });
  });

  describe('openQuoteProductsModal', () => {
    it('should open the products modal with merged data and form values', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.openQuoteProductsModal();

      // Assert
      expect(modalServiceMock.showTemplateModal).toHaveBeenCalledWith(
        QuoteProductDetailsModalComponent,
        expect.objectContaining({ isEdit: false, id: null, parentId: null }),
      );
    });
  });

  describe('canDisplayConvertButton / isQuoteConverted', () => {
    it('should return true when editing an Open quote', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { quoteProducts: [], status: QuoteStatus.Open } as unknown as Quote;

      // Act
      // Assert
      expect(component.canDisplayConvertButton()).toBe(true);
    });

    it('should return false when not editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = false;
      component.data = { quoteProducts: [], status: QuoteStatus.Open } as unknown as Quote;

      // Act
      // Assert
      expect(component.canDisplayConvertButton()).toBe(false);
    });

    it('should return false when the status is not Open', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;
      component.data = { quoteProducts: [], status: QuoteStatus.Canceled } as unknown as Quote;

      // Act
      // Assert
      expect(component.canDisplayConvertButton()).toBe(false);
    });

    it('should return true when isQuoteConverted is called and the status is Converted', () => {
      // Arrange
      const component = createComponent();
      component.data = { quoteProducts: [], status: QuoteStatus.Converted } as unknown as Quote;

      // Act
      // Assert
      expect(component.isQuoteConverted()).toBe(true);
    });

    it('should return false when isQuoteConverted is called and the status is not Converted', () => {
      // Arrange
      const component = createComponent();
      component.data = { quoteProducts: [], status: QuoteStatus.Open } as unknown as Quote;

      // Act
      // Assert
      expect(component.isQuoteConverted()).toBe(false);
    });
  });

  describe('initForm (private, via ngOnInit)', () => {
    it('should build an add-mode form without an id control', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeNull();
    });

    it('should build an edit-mode form with an id control when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('id')).toBeTruthy();
    });

    it('should disable businessPartnerName when data already has a businessPartnerId', () => {
      // Arrange
      const component = createComponent();
      component.data = { quoteProducts: [], businessPartnerId: 'bp1' } as unknown as Quote;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('businessPartnerName')!.disabled).toBe(true);
    });

    it('should auto-resolve businessPartnerId from the typed name in add mode', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.form.get('businessPartnerName')!.setValue('Cliente B');

      // Assert
      expect(component.form.get('businessPartnerId')!.value).toBe('bp2');
    });

    it('should leave businessPartnerId untouched when the typed name matches nothing', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();

      // Act
      component.form.get('businessPartnerName')!.setValue('Ninguém');

      // Assert
      expect(component.form.get('businessPartnerId')!.value).toBeNull();
    });
  });

  describe('quoteTrip form / autocomplete', () => {
    function tripComponent(): QuoteFormComponent {
      const component = createComponent();
      component.data = { quoteProducts: [], type: QuoteType.Trip } as unknown as Quote;
      component.ngOnInit();
      return component;
    }

    it('should not re-add the quoteTrip group when it already exists', () => {
      // Arrange
      const component = tripComponent();
      const originalGroup = component.form.get('quoteTrip');

      // Act
      (component as any).addQuoteTripForm();

      // Assert
      expect(component.form.get('quoteTrip')).toBe(originalGroup);
    });

    it('should filter vehicles by plate, brand, or model case-insensitively', () => {
      // Arrange
      const component = tripComponent();
      let result: Vehicle[] = [];
      component.filteredQuoteTripVehicles$.subscribe((r) => (result = r));

      // Act
      component.form.get('quoteTrip')!.get('vehiclePlate')!.setValue('abc');

      // Assert
      expect(result).toEqual([expect.objectContaining({ id: 'v1' })]);
    });

    it('should emit an empty vehicle list when there is no filter value', () => {
      // Arrange
      const component = tripComponent();
      let result: Vehicle[] = [];

      // Act
      component.filteredQuoteTripVehicles$.subscribe((r) => (result = r));

      // Assert
      expect(result).toEqual([]);
    });

    it('should treat a non-string vehiclePlate emission as an empty filter', () => {
      // Arrange
      const component = tripComponent();
      let result: Vehicle[] = [];
      component.filteredQuoteTripVehicles$.subscribe((r) => (result = r));

      // Act
      component.form.get('quoteTrip')!.get('vehiclePlate')!.setValue(null);

      // Assert
      expect(result).toEqual([]);
    });

    it('should treat a vehicle with missing plate, brand, or model as an empty string when filtering', () => {
      // Arrange
      const component = tripComponent();
      component.vehicles = [{ id: 'v3' } as Vehicle];
      let result: Vehicle[] = [];
      component.filteredQuoteTripVehicles$.subscribe((r) => (result = r));

      // Act
      component.form.get('quoteTrip')!.get('vehiclePlate')!.setValue('modelo');

      // Assert
      expect(result.find((v) => v.id === 'v3')).toBeUndefined();
    });

    it('should filter drivers by name case-insensitively', () => {
      // Arrange
      const component = tripComponent();
      let result: Driver[] = [];
      component.filteredQuoteTripDrivers$.subscribe((r) => (result = r));

      // Act
      component.form.get('quoteTrip')!.get('driverName')!.setValue('joão');

      // Assert
      expect(result).toEqual([expect.objectContaining({ id: 'd1' })]);
    });

    it('should treat a non-string driverName emission as an empty filter', () => {
      // Arrange
      const component = tripComponent();
      let result: Driver[] = [];
      component.filteredQuoteTripDrivers$.subscribe((r) => (result = r));

      // Act
      component.form.get('quoteTrip')!.get('driverName')!.setValue(null);

      // Assert
      expect(result).toEqual([]);
    });

    it('should emit an empty driver list when there is no filter value', () => {
      // Arrange
      const component = tripComponent();
      let result: Driver[] = [];

      // Act
      component.filteredQuoteTripDrivers$.subscribe((r) => (result = r));

      // Assert
      expect(result).toEqual([]);
    });

    it('should treat a driver with no name as an empty string when filtering', () => {
      // Arrange
      const component = tripComponent();
      component.drivers = [{ id: 'd3' } as Driver];
      let result: Driver[] = [];
      component.filteredQuoteTripDrivers$.subscribe((r) => (result = r));

      // Act
      component.form.get('quoteTrip')!.get('driverName')!.setValue('maria');

      // Assert
      expect(result.find((d) => d.id === 'd3')).toBeUndefined();
    });
  });

  describe('selectQuoteTripVehicle / selectQuoteTripDriver', () => {
    function tripComponent(): QuoteFormComponent {
      const component = createComponent();
      component.data = { quoteProducts: [], type: QuoteType.Trip } as unknown as Quote;
      component.ngOnInit();
      return component;
    }

    it('should do nothing when no vehicle is given', () => {
      // Arrange
      const component = tripComponent();

      // Act
      // Assert
      expect(() => component.selectQuoteTripVehicle(null as unknown as Vehicle)).not.toThrow();
      expect(component.form.get('quoteTrip')!.get('vehicleId')!.value).toBeNull();
    });

    it('should patch the quoteTrip group with the selected vehicle', () => {
      // Arrange
      const component = tripComponent();

      // Act
      component.selectQuoteTripVehicle(vehicles[0]);

      // Assert
      expect(component.form.get('quoteTrip')!.get('vehicleId')!.value).toBe('v1');
      expect(component.form.get('quoteTrip')!.get('vehiclePlate')!.value).toBe('ABC1234');
    });

    it('should do nothing when no driver is given', () => {
      // Arrange
      const component = tripComponent();

      // Act
      // Assert
      expect(() => component.selectQuoteTripDriver(null as unknown as Driver)).not.toThrow();
      expect(component.form.get('quoteTrip')!.get('driverId')!.value).toBeNull();
    });

    it('should patch the quoteTrip group with the selected driver', () => {
      // Arrange
      const component = tripComponent();

      // Act
      component.selectQuoteTripDriver(drivers[0]);

      // Assert
      expect(component.form.get('quoteTrip')!.get('driverId')!.value).toBe('d1');
      expect(component.form.get('quoteTrip')!.get('driverName')!.value).toBe('João');
    });
  });

  describe('onQuoteTripVehiclePlateBlur', () => {
    function tripComponent(): QuoteFormComponent {
      const component = createComponent();
      component.data = { quoteProducts: [], type: QuoteType.Trip } as unknown as Quote;
      component.ngOnInit();
      return component;
    }

    it('should clean the selection when the typed vehicle plate is blank', () => {
      // Arrange
      vi.useFakeTimers();
      const component = tripComponent();
      component.form.get('quoteTrip')!.get('vehiclePlate')!.setValue('   ');

      // Act
      component.onQuoteTripVehiclePlateBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('quoteTrip')!.get('vehicleId')!.value).toBeNull();
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should select the vehicle when the typed plate matches', () => {
      // Arrange
      vi.useFakeTimers();
      const component = tripComponent();
      component.form.get('quoteTrip')!.get('vehiclePlate')!.setValue('ABC1234');

      // Act
      component.onQuoteTripVehiclePlateBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('quoteTrip')!.get('vehicleId')!.value).toBe('v1');
    });

    it('should clean the selection when the typed plate matches nothing', () => {
      // Arrange
      vi.useFakeTimers();
      const component = tripComponent();
      component.form.get('quoteTrip')!.get('vehiclePlate')!.setValue('DESCONHECIDA');

      // Act
      component.onQuoteTripVehiclePlateBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('quoteTrip')!.get('vehicleId')!.value).toBeNull();
    });
  });

  describe('onQuoteTripDriverNameBlur', () => {
    function tripComponent(): QuoteFormComponent {
      const component = createComponent();
      component.data = { quoteProducts: [], type: QuoteType.Trip } as unknown as Quote;
      component.ngOnInit();
      return component;
    }

    it('should clean the selection when the typed driver name is blank', () => {
      // Arrange
      vi.useFakeTimers();
      const component = tripComponent();
      component.form.get('quoteTrip')!.get('driverName')!.setValue('   ');

      // Act
      component.onQuoteTripDriverNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('quoteTrip')!.get('driverId')!.value).toBeNull();
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should select the driver when the typed name matches', () => {
      // Arrange
      vi.useFakeTimers();
      const component = tripComponent();
      component.form.get('quoteTrip')!.get('driverName')!.setValue('João');

      // Act
      component.onQuoteTripDriverNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('quoteTrip')!.get('driverId')!.value).toBe('d1');
    });

    it('should clean the selection when the typed driver name matches nothing', () => {
      // Arrange
      vi.useFakeTimers();
      const component = tripComponent();
      component.form.get('quoteTrip')!.get('driverName')!.setValue('Desconhecido');

      // Act
      component.onQuoteTripDriverNameBlur();
      vi.advanceTimersByTime(200);

      // Assert
      expect(component.form.get('quoteTrip')!.get('driverId')!.value).toBeNull();
    });
  });

  describe('patchFormWithData (private, via ngOnInit)', () => {
    it('should compute payment defaults from the provided data', () => {
      // Arrange
      const component = createComponent();
      component.data = {
        quoteProducts: [],
        totalOfPayments: 3,
        totalPrice: 300,
        totalOfExpenses: 5,
        expenseTotalPrice: 50,
      } as unknown as Quote;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('totalOfPayments')!.value).toBe(3);
      expect(component.form.get('paymentTotalPrice')!.value).toBe(300);
      expect(component.form.get('totalOfExpenses')!.value).toBe(5);
      expect(component.form.get('expenseTotalPrice')!.value).toBe(50);
    });

    it('should default totalOfPayments to 1 and paymentTotalPrice/expenses to 0 when they are missing', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('totalOfPayments')!.value).toBe(1);
      expect(component.form.get('paymentTotalPrice')!.value).toBe(0);
      expect(component.form.get('totalOfExpenses')!.value).toBe(0);
      expect(component.form.get('expenseTotalPrice')!.value).toBe(0);
    });

    it('should not throw when there is no data', () => {
      // Arrange
      const component = createComponent();
      component.data = null;

      // Act
      // Assert
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });

  describe('setupAutoComplete / filteredBusinessPartners$', () => {
    it('should fall back to an empty array when the business partners response has no data', () => {
      // Arrange
      const component = createComponent();
      businessPartnerServiceMock.getClients.mockReturnValue(of({} as WebApiResponse<BusinessPartner[]>));
      component.ngOnInit();
      let result: BusinessPartner[] = [];

      // Act
      component.businessPartnersArray$.subscribe((r) => (result = r));

      // Assert
      expect(result).toEqual([]);
    });

    it('should emit an empty list when there is no filter value', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      let result: BusinessPartner[] = [];

      // Act
      component.filteredBusinessPartners$.subscribe((r) => (result = r));

      // Assert
      expect(result).toEqual([]);
    });

    it('should filter business partners by name case-insensitively', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      let result: BusinessPartner[] = [];
      component.filteredBusinessPartners$.subscribe((r) => (result = r));

      // Act
      component.form.get('businessPartnerName')!.setValue('cliente a');

      // Assert
      expect(result).toEqual([expect.objectContaining({ id: 'bp1' })]);
    });

    it('should treat a business partner with no name as an empty string when filtering', () => {
      // Arrange
      const component = createComponent();
      businessPartnerServiceMock.getClients.mockReturnValue(
        of({ data: [{ id: 'bp3' } as BusinessPartner] } as WebApiResponse<BusinessPartner[]>),
      );
      component.ngOnInit();
      let result: BusinessPartner[] = [];
      component.filteredBusinessPartners$.subscribe((r) => (result = r));

      // Act
      component.form.get('businessPartnerName')!.setValue('cliente');

      // Assert
      expect(result.find((bp) => bp.id === 'bp3')).toBeUndefined();
    });
  });

  describe('disableEditFields (private, via ngOnInit)', () => {
    it('should disable businessPartnerName and quoteNumber when editing', () => {
      // Arrange
      const component = createComponent();
      component.isEdit = true;

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('businessPartnerName')!.disabled).toBe(true);
      expect(component.form.get('quoteNumber')!.disabled).toBe(true);
    });

    it('should leave fields enabled when not editing', () => {
      // Arrange
      const component = createComponent();

      // Act
      component.ngOnInit();

      // Assert
      expect(component.form.get('quoteNumber')!.disabled).toBe(false);
    });
  });

  describe('setupPaymentPriceWatcher (private, via ngOnInit)', () => {
    it('should recompute paymentTotalPrice per installment when totalPrice changes', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.get('totalOfPayments')!.setValue(2);

      // Act
      component.form.get('totalPrice')!.setValue(100);

      // Assert
      expect(component.form.get('paymentTotalPrice')!.value).toBe(50);
    });

    it('should default totalOfPayments to 1 when its value is falsy', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.get('totalOfPayments')!.setValue(0);

      // Act
      component.form.get('totalPrice')!.setValue(100);

      // Assert
      expect(component.form.get('paymentTotalPrice')!.value).toBe(100);
    });

    it('should fall back to 1 payment when totalOfPayments is negative', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.get('totalOfPayments')!.setValue(-3);

      // Act
      component.form.get('totalPrice')!.setValue(100);

      // Assert
      expect(component.form.get('paymentTotalPrice')!.value).toBe(100);
    });
  });

  describe('totalPriceChange (private, via ngOnInit)', () => {
    it('should recompute totalPrice when discount changes', () => {
      // Arrange
      const component = createComponent();
      component.ngOnInit();
      component.form.get('price')!.setValue(100);

      // Act
      component.form.get('discount')!.setValue(10);

      // Assert
      expect(component.form.get('totalPrice')!.value).toBe(90);
    });
  });

  describe('updatePriceFields / updateTotalPriceFields (private, via removeProduct)', () => {
    it('should treat a falsy product totalPrice as zero when summing', () => {
      // Arrange
      const component = createComponent();
      component.data = { quoteProducts: [{ totalPrice: 0 }, { totalPrice: 30 }] } as unknown as Quote;
      component.ngOnInit();

      // Act
      component.removeProduct(0);

      // Assert
      expect(component.form.get('price')!.value).toBe(30);
    });

    it('should treat a non-numeric price or discount as zero', () => {
      // Arrange
      const component = createComponent();
      component.data = { quoteProducts: [] } as unknown as Quote;
      component.ngOnInit();
      component.form.get('price')!.setValue('');
      component.form.get('discount')!.setValue('');

      // Act
      (component as any).updateTotalPriceFields();

      // Assert
      expect(component.form.get('totalPrice')!.value).toBe(0);
    });
  });
});
