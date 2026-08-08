import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import {
  ApiType,
  CurrencyService,
  FormBaseComponent,
  NotificationService,
  ResponseStatus,
  Vehicle,
  VehicleService,
  VehicleStatus,
  VehicleType,
  WebApiResponse,
} from '@friday/core';

import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-vehicle-form',
  templateUrl: './vehicle-form.component.html',
  styleUrl: './vehicle-form.component.scss',
  standalone: false,
})
export class VehicleFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges
{
  @Input()
  isEdit = false;

  @Input()
  data?: Vehicle | null;

  typeOptions = [
    { label: 'Ônibus', value: VehicleType.Bus },
    { label: 'Micro-ônibus', value: VehicleType.MiniBus },
    { label: 'Van', value: VehicleType.Van },
    { label: 'Carro', value: VehicleType.Car },
    { label: 'Outro', value: VehicleType.Other },
  ];

  statusOptions = [
    { label: 'Disponível', value: VehicleStatus.Available },
    { label: 'Em manutenção', value: VehicleStatus.InMaintenance },
    { label: 'Bloqueado', value: VehicleStatus.Blocked },
    { label: 'Inativo', value: VehicleStatus.Inactive },
  ];

  private _baseEndPoint: ApiType = ApiType.Vehicles;

  constructor(
    private currencyService: CurrencyService,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private vehicleService: VehicleService,
    private routerService: Router,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.patchFormWithData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue && this.form) {
      this.form.patchValue(changes['data'].currentValue);
    }
  }

  submit(): Observable<WebApiResponse<Vehicle> | null> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return of(null);
    }

    const rawValue = this.form.getRawValue();

    if (this.data) {
      Object.assign(this.data!, rawValue);
    }

    return this.save(rawValue as Vehicle).pipe(
      tap({
        next: (response: WebApiResponse<Vehicle>) => this.savePage(response),
        error: () =>
          this.notificationService.showMessage(
            ResponseStatus.Error,
            'Erro ao salvar',
          ),
      }),
    );
  }

  cancel(): void {
    this.routerService.navigateByUrl(`/${this._baseEndPoint}`);
  }

  remove(): void {
    if (!this.data) {
      return;
    }

    this.vehicleService
      .delete(this.data)
      .pipe(
        tap({
          next: (response: WebApiResponse<Vehicle>) => {
            this.notificationService.showMessage(
              response.status,
              response.message,
            );
            if (response.status === ResponseStatus.Success) {
              this.routerService.navigateByUrl(`/${this._baseEndPoint}`);
            }
          },
          error: () =>
            this.notificationService.showMessage(
              ResponseStatus.Error,
              'Erro ao remover',
            ),
        }),
      )
      .subscribe();
  }

  onPricePerKmBlur(): void {
    const control = this.form.get('pricePerKmFormatted');
    if (!control) {
      return;
    }
    const value = this.currencyService.parseCurrencyBRL(control.value);
    control.setValue(this.currencyService.formatCurrencyBRL(value));
    this.form.get('pricePerKm')?.setValue(value);
  }

  onDailyRateBlur(): void {
    const control = this.form.get('dailyRateFormatted');
    if (!control) {
      return;
    }
    const value = this.currencyService.parseCurrencyBRL(control.value);
    control.setValue(this.currencyService.formatCurrencyBRL(value));
    this.form.get('dailyRate')?.setValue(value);
  }

  private initForm(): void {
    const commonControls = {
      plate: ['', Validators.required],
      renavam: [''],
      chassis: [''],
      brand: ['', Validators.required],
      model: ['', Validators.required],
      manufactureYear: [null as number | null],
      modelYear: [null as number | null],
      seatCapacity: [1, [Validators.required, Validators.min(1)]],
      type: [VehicleType.Bus, Validators.required],
      status: [VehicleStatus.Available, Validators.required],
      pricePerKm: [0, [Validators.required, Validators.min(0)]],
      pricePerKmFormatted: ['', Validators.required],
      dailyRate: [0, [Validators.required, Validators.min(0)]],
      dailyRateFormatted: ['', Validators.required],
      transportLicenseNumber: [''],
      transportLicenseExpiryDate: [null as Date | null],
      odometer: [0, [Validators.min(0)]],
    };

    this.form = !this.isEdit
      ? this.formBuilder.group(commonControls)
      : this.formBuilder.group({ id: [''], ...commonControls });
  }

  private patchFormWithData(): void {
    if (this.data && this.form) {
      const patch = {
        ...this.data,
        pricePerKmFormatted: this.currencyService.formatCurrencyBRL(
          this.data.pricePerKm,
        ),
        dailyRateFormatted: this.currencyService.formatCurrencyBRL(
          this.data.dailyRate,
        ),
      };
      this.form.patchValue(patch);
    } else {
      this.form
        .get('pricePerKmFormatted')
        ?.setValue(this.currencyService.formatCurrencyBRL(0));
      this.form
        .get('dailyRateFormatted')
        ?.setValue(this.currencyService.formatCurrencyBRL(0));
    }
  }

  private save(vehicle: Vehicle): Observable<WebApiResponse<Vehicle>> {
    return this.isEdit && this.data
      ? this.vehicleService.update(vehicle)
      : this.vehicleService.add(vehicle);
  }

  private savePage(response: WebApiResponse<Vehicle>): void {
    if (this.isEdit && this.data) {
      this.notificationService.showMessage(response.status, response.message);
      this.data = response.data;
    } else if (response.status === ResponseStatus.Success) {
      this.routerService.navigateByUrl(
        `/${this._baseEndPoint}/${response.data.id}`,
      );
    } else {
      this.notificationService.showMessage(response.status, response.message);
    }
  }
}
