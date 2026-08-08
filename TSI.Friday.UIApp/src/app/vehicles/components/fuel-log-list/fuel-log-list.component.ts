import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  FuelLog,
  FuelLogService,
  NotificationService,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-fuel-log-list',
  templateUrl: './fuel-log-list.component.html',
  styleUrl: './fuel-log-list.component.scss',
  standalone: false,
})
export class FuelLogListComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  vehicleId!: string;

  fuelLogs: FuelLog[] = [];
  showForm = false;
  form!: ReturnType<FormBuilder['group']>;

  private _destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private fuelLogService: FuelLogService,
  ) {
    this.form = this.formBuilder.group({
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      odometer: [0, [Validators.required, Validators.min(0)]],
      liters: [0, [Validators.required, Validators.min(0)]],
      pricePerLiter: [0, [Validators.required, Validators.min(0)]],
      gasStation: [''],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicleId'] && !changes['vehicleId'].firstChange) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  addFuelLog(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const fuelLog = {
      id: '',
      date: raw.date,
      odometer: raw.odometer,
      liters: raw.liters,
      pricePerLiter: raw.pricePerLiter,
      totalCost: raw.liters * raw.pricePerLiter,
      gasStation: raw.gasStation,
      vehicleId: this.vehicleId,
    } as FuelLog;

    this.fuelLogService
      .add(fuelLog)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<FuelLog>) => {
        this.notificationService.showMessage(response.status, response.message);
        if (response.status === ResponseStatus.Success) {
          this.showForm = false;
          this.form.reset({
            date: new Date().toISOString().substring(0, 10),
            odometer: 0,
            liters: 0,
            pricePerLiter: 0,
            gasStation: '',
          });
          this.load();
        }
      });
  }

  removeFuelLog(fuelLog: FuelLog): void {
    this.fuelLogService
      .delete(fuelLog)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<FuelLog>) => {
        this.notificationService.showMessage(response.status, response.message);
        this.load();
      });
  }

  private load(): void {
    if (!this.vehicleId) {
      return;
    }
    this.fuelLogService
      .getByVehicle(this.vehicleId)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response) => {
        this.fuelLogs = response.data ?? [];
      });
  }
}
