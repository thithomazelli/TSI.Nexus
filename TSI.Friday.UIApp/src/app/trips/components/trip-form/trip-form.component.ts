import { Subscription, tap, of, combineLatestWith } from 'rxjs';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import {
  BusinessPartnerService,
  BusinessPartner,
  Driver,
  DriverService,
  Trip,
  TripDriver,
  TripDriverService,
  OrderStatus,
  FormBaseComponent,
  ModalService,
  PaymentType,
  PaymentCondition,
  PaymentMethod,
  PaymentStatus,
  Vehicle,
  VehicleService,
  WebApiResponse,
  ApiType,
  ResponseStatus,
  NotificationService,
  TripService,
  TranslationService,
} from '@friday/core';

import { MatDialogRef } from '@angular/material/dialog';

import { Observable, startWith, map, forkJoin } from 'rxjs';

import { BusinessPartnerDetailsModalComponent } from '../../../business-partner/components/business-partner-details-modal/business-partner-details-modal.component';
import { DriverDetailsModalComponent } from '../../../drivers/components/driver-details-modal/driver-details-modal.component';
import { TripDetailsModalComponent } from '../trip-details-modal/trip-details-modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-trip-form',
  templateUrl: './trip-form.component.html',
  styleUrl: './trip-form.component.scss',
  standalone: false,
})
export class TripFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input()
  isModal = false;

  @Input()
  isEdit = false;

  @Input()
  data?: Trip | null = <Trip>{};

  @Input()
  compact = false;

  @Input()
  dialogRef?: MatDialogRef<TripDetailsModalComponent>;

  canDisplayTransactionForm: boolean = true;
  businessPartners$!: Observable<WebApiResponse<BusinessPartner[]>>;
  businessPartnersArray$!: Observable<BusinessPartner[]>;
  filteredBusinessPartners$!: Observable<BusinessPartner[]>;

  vehicles: Vehicle[] = [];
  drivers: Driver[] = [];

  tripStatusOptions = [
    { value: OrderStatus.Open, label: 'Em Aberto' },
    { value: OrderStatus.Closed, label: 'Fechado' },
    { value: OrderStatus.WaitingPayment, label: 'Aguardando Pagamento' },
  ];

  private _subscriptions: Subscription[] = [];
  private _baseEndPoint = ApiType.Trips;
  private totalOfPaymentsSubscription?: Subscription;

  inlineTripDriverForm!: FormGroup;
  filteredInlineDriversByName$!: Observable<Driver[]>;

  constructor(
    private businessPartnerService: BusinessPartnerService,
    private driverService: DriverService,
    private formBuilder: FormBuilder,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private tripService: TripService,
    private tripDriverService: TripDriverService,
    private vehicleService: VehicleService,
    private routerService: Router,
    private translationService: TranslationService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.disableEditFields();
    this.patchFormWithData();
    this.setupAutoComplete();
    this.loadVehiclesAndDrivers();
    this.setupInlineTripDriverForm();
    this.totalPriceChange();
    this.setupTotalOfPaymentsWatcher();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data && this.form) {
      this.patchFormWithData();
      this.setupTotalOfPaymentsWatcher();
    }
  }

  ngOnDestroy(): void {
    if (this.totalOfPaymentsSubscription) {
      this.totalOfPaymentsSubscription.unsubscribe();
    }
    this._subscriptions.forEach((sub) => sub.unsubscribe());
  }

  submit(): Observable<WebApiResponse<Trip> | null> {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return of(null);
    }

    const rawValue = this.form.getRawValue();

    if (this.canDisplayTransactionForm && rawValue.transaction) {
      rawValue.transaction.businessPartnerId = rawValue.businessPartnerId;
      rawValue.transaction.businessPartnerName = rawValue.businessPartnerName;
    }

    if (rawValue.transaction && this.data?.transaction?.id) {
      rawValue.transaction.id = this.data.transaction.id;
    }

    if (this.data) {
      Object.assign(this.data!, rawValue);
    }

    if (
      this.canDisplayTransactionForm &&
      this.data?.transaction &&
      this.data.transaction.id == null
    ) {
      delete this.data.transaction.id;
    }

    return this.save(this.data as Trip).pipe(
      tap({
        next: (response: WebApiResponse<Trip>) => {
          // The backend reports business-rule failures as a 200 response with status Error and
          // data: null rather than an HTTP error, so this has to be checked before treating the
          // save as successful - otherwise savePage()/saveModal() crash reading .id off a null
          // response.data.
          if (response.status !== ResponseStatus.Success) {
            this.notificationService.showMessage(response.status, response.message);
            return;
          }
          this.flushStagedTripDrivers(response);
        },
        error: () => {
          this.notificationService.showMessage('Error', 'Erro ao salvar');
        },
      }),
    );
  }

  // Motoristas staged in the inline grid (Add mode only - see setupInlineTripDriverForm) only
  // exist in memory until the Trip itself has a real Id, so they're flushed as real TripDrivers
  // (each carrying its own expense Payment - see TripDriverService.Add) right after a successful
  // create, before navigating/closing the same way order-form does for staged OrderProducts.
  private flushStagedTripDrivers(response: WebApiResponse<Trip>): void {
    const stagedDrivers = !this.isEdit ? (this.data?.tripDrivers ?? []) : [];
    const tripId = response.data?.id;

    const finish = () => {
      if (this.isModal) {
        this.saveModal(response);
      } else {
        this.savePage(response);
      }
    };

    if (stagedDrivers.length === 0 || !tripId) {
      finish();
      return;
    }

    forkJoin(
      stagedDrivers.map((tripDriver) =>
        this.tripDriverService.add({ ...tripDriver, tripId }),
      ),
    ).subscribe(finish);
  }

  cancel(): void {
    if (this.isModal) {
      this.modalService.hideModal(this.dialogRef);
    } else {
      this.routerService.navigateByUrl(`/${this._baseEndPoint}`);
    }
  }

  remove(): void {
    this.modalService.hideModal();
    this.modalService
      .showSweetConfirmation(
        '',
        'Deseja realmente excluir este registro?',
        'question',
      )
      .then((result: any) => {
        if (result.isConfirmed) {
          this.tripService
            .delete(this.data as Trip)
            .pipe(
              tap({
                next: (response: WebApiResponse<Trip>) => {
                  if (this.isModal) {
                    this.modalService.hideModal(this.dialogRef);
                    this.modalService.showSweetNotification(
                      '',
                      response.message,
                      response.status,
                    );
                  } else {
                    this.modalService.showSweetNotification(
                      '',
                      response.message,
                      response.status,
                    );
                    if (response.status === ResponseStatus.Success) {
                      this.routerService.navigateByUrl(
                        `/${this._baseEndPoint}`,
                      );
                    }
                  }
                },
                error: () => {
                  this.notificationService.showMessage(
                    'error',
                    'Erro ao remover',
                  );
                },
              }),
            )
            .subscribe();
        } else {
          if (this.isModal) {
            const initialState = {
              isEdit: this.isEdit,
              data: this.data,
              id: this.data?.id,
            };
            this.modalService.showTemplateModal(
              TripDetailsModalComponent,
              initialState,
            );
          }
        }
      });
  }

  get transactionFormGroup(): FormGroup {
    return this.form.get('transaction') as FormGroup;
  }

  async onClientBlur(): Promise<void> {
    setTimeout(() => {
      const businessPartnerName = this.form
        .get('businessPartnerName')!
        .value?.trim();
      if (!businessPartnerName) {
        this.cleanClientSelection();
        return;
      }
      const sub = this.businessPartnersArray$.subscribe((clients) => {
        const found = clients.find((c) => c.name === businessPartnerName);
        if (!found) {
          const confirmRef = this.modalService.showConfirmation({
            title: this.translationService.instant('COMMON.ENTITY_NOT_FOUND', { entity: this.translationService.instant('BUSINESS_PARTNER.CLIENT_SINGULAR') }),
            message: this.translationService.instant('COMMON.CONFIRM_ADD_ENTITY', { entityLower: this.translationService.instant('BUSINESS_PARTNER.CLIENT_SINGULAR').toLowerCase(), name: businessPartnerName }),
            cancelButtonText: this.translationService.instant('COMMON.CANCEL'),
            confirmButtonText: this.translationService.instant('COMMON.YES'),
          });
          const confirmSub = confirmRef
            .afterClosed()
            .subscribe((confirmed: boolean) => {
              if (confirmed) {
                const clientFormRef: MatDialogRef<any> =
                  this.modalService.showTemplateModal(
                    BusinessPartnerDetailsModalComponent,
                    {
                      data: { name: businessPartnerName },
                      disableClose: true,
                    },
                  );
                const clientFormSub = clientFormRef
                  .afterClosed()
                  .subscribe((result: BusinessPartner | undefined) => {
                    if (result) {
                      this.businessPartnerService.addOrUpdateBusinessPartner(
                        result,
                      );
                      this.form
                        .get('businessPartnerName')!
                        .setValue(result.name);
                      this.form.get('businessPartnerId')!.setValue(result.id);
                    } else {
                      this.cleanClientSelection();
                    }
                  });
                this._subscriptions.push(clientFormSub);
              } else {
                this.cleanClientSelection();
              }
            });
          this._subscriptions.push(confirmSub);
        }
      });
      this._subscriptions.push(sub);
    }, 200);
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      tripNumber: [''],
      quoteNumber: [''],
      businessPartnerId: [null, Validators.required],
      businessPartnerName: [
        { value: '', disabled: this.data?.businessPartnerId != null },
        Validators.required,
      ],
      date: [new Date(), Validators.required],
      status: [OrderStatus.Open, Validators.required],
      price: [0, [Validators.min(0)]],
      discount: [0, [Validators.min(0), Validators.max(100)]],
      totalPrice: [{ value: 0, disabled: true }],
      transactionId: [null],
      vehicleId: [null],
      route: [''],
      distanceKm: [0, [Validators.min(0)]],
      dailyCount: [0, [Validators.min(0)]],
      transportLicenseNumber: [''],
      transportLicenseExpiryDate: [null as Date | null],
    });

    this.addTransactionForm();

    if (this.isEdit) {
      this.form.addControl('id', this.formBuilder.control(''));
    } else {
      this._subscriptions.push(
        this.form.get('businessPartnerName')!.valueChanges.subscribe((name) => {
          const sub = this.businessPartnersArray$.subscribe(
            (businessPartners) => {
              const businessPartner = businessPartners.find(
                (p: BusinessPartner) => p.name === name,
              );
              if (businessPartner) {
                this.form
                  .get('businessPartnerId')!
                  .setValue(businessPartner.id);
              }
            },
          );
          this._subscriptions.push(sub);
        }),
      );
    }

    this._subscriptions.push(
      this.form.get('price')!.valueChanges.subscribe(() =>
        this.updateTotalPriceFields(),
      ),
    );
  }

  private addTransactionForm(): void {
    if (!this.form.contains('transaction')) {
      const transactionGroup = this.formBuilder.group({
        id: [null],
        type: [PaymentType.Incoming],
        date: [new Date(), Validators.required],
        method: [PaymentMethod.Cash, Validators.required],
        status: [PaymentStatus.Pending, Validators.required],
        category: ['Recebimentos'],
        condition: [
          {
            value: PaymentCondition.FullPayment,
            disabled: this.isEdit ? true : false,
          },
        ],
        totalOfPayments: [
          {
            value: 1,
            disabled: this.isEdit ? true : false,
          },
          Validators.required,
        ],
        paymentTotalPrice: [{ value: 0, disabled: true }, [Validators.min(0)]],
        totalOfExpenses: [
          {
            value: 0,
            disabled: this.isEdit ? true : false,
          },
          Validators.required,
        ],
        expenseTotalPrice: [
          { value: 0, disabled: this.isEdit ? true : false },
          [Validators.min(0)],
        ],
      });
      this.form.addControl('transaction', transactionGroup);
    }
  }

  private patchFormWithData(): void {
    if (this.data && this.form) {
      const paymentTotalPrice = !this.isEdit
        ? (this.data.totalPrice ?? 0) /
          (this.data.transaction?.totalOfPayments || 1)
        : this.data.transaction?.paymentTotalPrice;

      const patch = {
        ...this.data,
        transaction: {
          ...this.data.transaction,
          id: this.data.transaction?.id ?? null,
          paymentTotalPrice,
        },
      };

      this.form.patchValue(patch);
    }
  }

  private cleanClientSelection(): void {
    this.form.get('businessPartnerId')!.setValue('');
    this.markAsTouched('businessPartnerId');
    this.form.get('businessPartnerId')!.setErrors({ required: true });
    this.form.get('businessPartnerName')!.setValue('');
    this.markAsTouched('businessPartnerName');
    this.form.get('businessPartnerName')!.setErrors({ required: true });
  }

  private setupAutoComplete(): void {
    this.businessPartners$ = this.businessPartnerService.getClients();
    this.businessPartnersArray$ = this.businessPartners$.pipe(
      map((response) => response.data ?? []),
    );

    this.filteredBusinessPartners$ = this.form
      .get('businessPartnerName')!
      .valueChanges.pipe(
        startWith(''),
        combineLatestWith(this.businessPartnersArray$),
        map(([value, businessPartners]) => {
          const filterValue = (value || '').toLowerCase();
          if (!filterValue) {
            return [];
          }
          return businessPartners.filter((businessPartner: BusinessPartner) =>
            (businessPartner.name || '').toLowerCase().includes(filterValue),
          );
        }),
      );
  }

  private loadVehiclesAndDrivers(): void {
    const vehicleSub = this.vehicleService
      .getAll()
      .subscribe((response) => (this.vehicles = response.data ?? []));
    const driverSub = this.driverService
      .getAll()
      .subscribe((response) => (this.drivers = response.data ?? []));
    this._subscriptions.push(vehicleSub, driverSub);
  }

  private setupInlineTripDriverForm(): void {
    this.inlineTripDriverForm = this.formBuilder.group({
      driverId: [null],
      driverName: [''],
      driverLicenseNumber: [''],
      driverLicenseExpiryDate: [null as Date | null],
      amount: [0],
    });

    this.filteredInlineDriversByName$ = this.inlineTripDriverForm
      .get('driverName')!
      .valueChanges.pipe(
        startWith(''),
        map((value: string | Driver) => {
          // mat-autocomplete briefly writes the selected option's whole object (not just its
          // string label) back through this same control before selectInlineTripDriver()
          // overwrites it with driver.name - guard against that non-string value the same way
          // order-form's inline SKU filter already does.
          const filterValue = (
            typeof value === 'string' ? value : ''
          ).toLowerCase();
          if (!filterValue) {
            return [];
          }
          return this.drivers.filter((driver) =>
            (driver.name || '').toLowerCase().includes(filterValue),
          );
        }),
      );
  }

  async onInlineDriverNameBlur(): Promise<void> {
    setTimeout(() => {
      const driverName = this.inlineTripDriverForm
        .get('driverName')!
        .value?.trim();
      if (!driverName) {
        this.cleanInlineTripDriverSelection();
        return;
      }
      const found = this.drivers.find((d) => d.name === driverName);
      if (found) {
        return;
      }
      const entityLabel = this.translationService.instant('SIDEBAR.DRIVER');
      const confirmRef = this.modalService.showConfirmation({
        title: this.translationService.instant('COMMON.ENTITY_NOT_FOUND', { entity: entityLabel }),
        message: this.translationService.instant('COMMON.CONFIRM_ADD_ENTITY', { entityLower: entityLabel.toLowerCase(), name: driverName }),
        cancelButtonText: this.translationService.instant('COMMON.CANCEL'),
        confirmButtonText: this.translationService.instant('COMMON.YES'),
      });
      confirmRef.afterClosed().subscribe((confirmed: boolean) => {
        if (confirmed) {
          const driverFormRef: MatDialogRef<any> = this.modalService.showTemplateModal(
            DriverDetailsModalComponent,
            {
              data: { name: driverName },
              disableClose: true,
            },
          );
          const driverFormSub = driverFormRef
            .afterClosed()
            .subscribe((result: WebApiResponse<Driver> | undefined) => {
              if (result?.data) {
                this.drivers.push(result.data);
                this.selectInlineTripDriver(result.data);
              } else {
                this.cleanInlineTripDriverSelection();
              }
            });
          this._subscriptions.push(driverFormSub);
        } else {
          this.cleanInlineTripDriverSelection();
        }
      });
    }, 200);
  }

  selectInlineTripDriver(driver: Driver): void {
    if (!driver) {
      return;
    }

    const alreadyAdded = this.data?.tripDrivers?.some(
      (td) => td.driverId === driver.id,
    );
    if (alreadyAdded) {
      this.modalService.showNotification(
        false,
        this.translationService.instant('TRIPS.DRIVER_ALREADY_ADDED_TITLE'),
        this.translationService.instant('TRIPS.DRIVER_ALREADY_ADDED_MESSAGE', { name: driver.name + '' }),
      );
      this.cleanInlineTripDriverSelection();
      return;
    }

    this.inlineTripDriverForm.patchValue({
      driverId: driver.id,
      driverName: driver.name,
      driverLicenseNumber: driver.licenseNumber,
      driverLicenseExpiryDate: driver.licenseExpiryDate,
    });
  }

  addInlineTripDriver(): void {
    const raw = this.inlineTripDriverForm.getRawValue();
    if (!raw.driverId) {
      return;
    }

    const tripDriver = {
      driverId: raw.driverId,
      driverName: raw.driverName,
      driverLicenseNumber: raw.driverLicenseNumber,
      driverLicenseExpiryDate: raw.driverLicenseExpiryDate,
      amount: Number(raw.amount) || 0,
    } as TripDriver;

    if (!this.data) {
      return;
    }
    if (!this.data.tripDrivers) {
      this.data.tripDrivers = [];
    }
    this.data.tripDrivers.push(tripDriver);
    this.cleanInlineTripDriverSelection();
  }

  removeTripDriver(index: number): void {
    if (!this.data?.tripDrivers) {
      return;
    }
    this.data.tripDrivers.splice(index, 1);
  }

  private cleanInlineTripDriverSelection(): void {
    this.inlineTripDriverForm.reset({
      driverId: null,
      driverName: '',
      driverLicenseNumber: '',
      driverLicenseExpiryDate: null,
      amount: 0,
    });
  }

  private disableEditFields(): void {
    if (this.isEdit && this.form) {
      this.form.get('businessPartnerName')?.disable();
      this.form.get('tripNumber')?.disable();
    }
  }

  private totalPriceChange(): void {
    this.form
      .get('discount')
      ?.valueChanges.subscribe(() => this.updateTotalPriceFields());
  }

  private updateTotalPriceFields(): void {
    const price = Number(this.form.get('price')?.value) || 0;
    const discount = Number(this.form.get('discount')?.value) || 0;
    const total = price * (1 - discount / 100);
    this.form.get('totalPrice')?.setValue(total);

    const transactionGroup = this.form.get('transaction') as FormGroup | null;
    if (!this.isEdit && transactionGroup) {
      transactionGroup.get('paymentTotalPrice')?.setValue(total);
    }
  }

  private setupTotalOfPaymentsWatcher(): void {
    if (this.totalOfPaymentsSubscription) {
      this.totalOfPaymentsSubscription.unsubscribe();
    }
    const transactionGroup = this.form.get('transaction') as FormGroup | null;
    if (transactionGroup && transactionGroup.get('totalOfPayments')) {
      this.totalOfPaymentsSubscription = transactionGroup
        .get('totalOfPayments')!
        .valueChanges.subscribe(() => {
          this.updateTotalPriceFields();
        });
    }
  }

  private save(trip: Trip): Observable<WebApiResponse<Trip>> {
    return this.isEdit && this.data
      ? this.tripService.update(trip)
      : this.tripService.add(trip);
  }

  private saveModal(response: WebApiResponse<Trip>): void {
    this.dialogRef?.close(response);
    this.modalService.showNotification(
      response.status == ResponseStatus.Success,
      'Viagem adicionada',
      response.message,
    );
  }

  private savePage(response: WebApiResponse<Trip>): void {
    if (this.isEdit && this.data) {
      this.notificationService.showMessage(response.status, response.message);
      this.data = response.data;
    } else {
      this.routerService.navigateByUrl(
        `/${this._baseEndPoint}/${response.data.id}`,
      );
    }
  }
}
