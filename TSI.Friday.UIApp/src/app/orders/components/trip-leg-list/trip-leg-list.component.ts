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
  NotificationService,
  ResponseStatus,
  TripLeg,
  TripLegService,
  WebApiResponse,
} from '@friday/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-trip-leg-list',
  templateUrl: './trip-leg-list.component.html',
  styleUrl: './trip-leg-list.component.scss',
  standalone: false,
})
export class TripLegListComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  orderId!: string;

  tripLegs: TripLeg[] = [];
  showForm = false;
  form!: ReturnType<FormBuilder['group']>;

  private _destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private tripLegService: TripLegService,
  ) {
    this.form = this.formBuilder.group({
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      departureDate: ['', Validators.required],
      distanceKm: [0, [Validators.min(0)]],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['orderId'] && !changes['orderId'].firstChange) {
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

  addTripLeg(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const tripLeg = {
      id: '',
      sequenceNumber: this.tripLegs.length + 1,
      origin: raw.origin,
      destination: raw.destination,
      departureDate: raw.departureDate,
      distanceKm: raw.distanceKm,
      notes: raw.notes,
      orderId: this.orderId,
    } as TripLeg;

    this.tripLegService
      .add(tripLeg)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<TripLeg>) => {
        this.notificationService.showMessage(response.status, response.message);
        if (response.status === ResponseStatus.Success) {
          this.showForm = false;
          this.form.reset({
            origin: '',
            destination: '',
            departureDate: '',
            distanceKm: 0,
            notes: '',
          });
          this.load();
        }
      });
  }

  removeTripLeg(tripLeg: TripLeg): void {
    this.tripLegService
      .delete(tripLeg)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<TripLeg>) => {
        this.notificationService.showMessage(response.status, response.message);
        this.load();
      });
  }

  private load(): void {
    if (!this.orderId) {
      return;
    }
    this.tripLegService
      .getByOrder(this.orderId)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response) => {
        this.tripLegs = response.data ?? [];
      });
  }
}
