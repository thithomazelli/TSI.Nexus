import { Component, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  NotificationService,
  ResponseStatus,
  TripLeg,
  TripLegService,
  TranslationService,
  WebApiResponse,
} from '@friday/core';
import { forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'app-trip-leg-details-modal',
  templateUrl: './trip-leg-details-modal.component.html',
  styleUrl: './trip-leg-details-modal.component.scss',
  standalone: false,
})
export class TripLegDetailsModalComponent {
  saving = false;

  isEdit: boolean;
  tripId: string;
  private _id: string | null = null;
  private _nextSequenceNumber: number;

  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<TripLegDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private formBuilder: FormBuilder,
    private tripLegService: TripLegService,
    private notificationService: NotificationService,
    private translationService: TranslationService,
  ) {
    const existing: TripLeg | null = dialogData?.data ?? null;
    this.isEdit = dialogData?.isEdit ?? !!existing?.id;
    this.tripId = dialogData?.tripId ?? dialogData?.parentId ?? '';
    this._nextSequenceNumber = dialogData?.nextSequenceNumber ?? 1;

    if (this.isEdit && existing) {
      this._id = existing.id ?? null;
      const { dateOnly, time } = this.splitDateAndTime(existing.departureDate);
      this.form = this.formBuilder.group({
        origin: [existing.origin ?? '', Validators.required],
        destination: [existing.destination ?? '', Validators.required],
        dateOnly: [dateOnly, Validators.required],
        time: [time],
        distanceKm: [existing.distanceKm ?? 0, [Validators.min(0)]],
        notes: [existing.notes ?? ''],
      });
    } else {
      this.form = this.formBuilder.group({
        origin: ['', Validators.required],
        stops: this.formBuilder.array([this.buildStopGroup()]),
      });
    }
  }

  get stops(): FormArray {
    return this.form.get('stops') as FormArray;
  }

  addStop(): void {
    this.stops.push(this.buildStopGroup());
  }

  removeStop(index: number): void {
    if (this.stops.length > 1) {
      this.stops.removeAt(index);
    }
  }

  close(): void {
    this.dialogRef.close(null);
  }

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.isEdit) {
      this.submitEdit();
    } else {
      this.submitAdd();
    }
  }

  private submitEdit(): void {
    const raw = this.form.getRawValue();
    const tripLeg = {
      id: this._id as string,
      tripId: this.tripId,
      origin: raw.origin,
      destination: raw.destination,
      departureDate: this.combineDateAndTime(raw.dateOnly, raw.time),
      distanceKm: raw.distanceKm ?? 0,
      notes: raw.notes ?? '',
    } as TripLeg;

    this.saving = true;
    this.tripLegService.update(tripLeg).subscribe({
      next: (response: WebApiResponse<TripLeg>) => {
        this.saving = false;
        this.notificationService.showMessage(response.status, response.message);
        if (response.status === ResponseStatus.Success) {
          this.dialogRef.close(response);
        }
      },
      error: () => {
        this.saving = false;
        this.notificationService.showMessage(
          ResponseStatus.Error,
          this.translationService.instant('TRIPS.SAVE_LEGS_ERROR'),
        );
      },
    });
  }

  private submitAdd(): void {
    const raw = this.form.getRawValue();
    const legs: TripLeg[] = [];
    let previousPoint = raw.origin!;

    (raw.stops ?? []).forEach((stop: any, index: number) => {
      legs.push({
        sequenceNumber: this._nextSequenceNumber + index,
        origin: previousPoint,
        destination: stop.destination,
        departureDate: this.combineDateAndTime(stop.dateOnly, stop.time),
        distanceKm: stop.distanceKm ?? 0,
        notes: stop.notes ?? '',
        tripId: this.tripId,
      } as TripLeg);
      previousPoint = stop.destination;
    });

    if (legs.length === 0) {
      return;
    }

    this.saving = true;
    const requests: Observable<WebApiResponse<TripLeg>>[] = legs.map((leg) =>
      this.tripLegService.add(leg),
    );

    forkJoin(requests).subscribe({
      next: (responses) => {
        this.saving = false;
        const failed = responses.find((r) => r.status !== ResponseStatus.Success);
        if (failed) {
          this.notificationService.showMessage(failed.status, failed.message);
          return;
        }
        this.notificationService.showMessage(
          ResponseStatus.Success,
          legs.length === 1
            ? this.translationService.instant('TRIPS.LEG_ADDED_SINGLE')
            : this.translationService.instant('TRIPS.LEG_ADDED_PLURAL', { count: legs.length + '' }),
        );
        this.dialogRef.close(responses);
      },
      error: () => {
        this.saving = false;
        this.notificationService.showMessage(
          ResponseStatus.Error,
          this.translationService.instant('TRIPS.SAVE_LEGS_ERROR'),
        );
      },
    });
  }

  private buildStopGroup(): FormGroup {
    return this.formBuilder.group({
      destination: ['', Validators.required],
      dateOnly: ['', Validators.required],
      time: [''],
      distanceKm: [0, [Validators.min(0)]],
      notes: [''],
    });
  }

  /**
   * app-date-field yields a "DD/MM/YYYY" string when typed manually, but a Moment/Date instance
   * when picked from the calendar; combines either with an optional "HH:mm" time into a datetime.
   */
  private combineDateAndTime(dateOnly: any, time?: string | null): Date {
    if (!dateOnly) {
      return new Date();
    }
    let day: number, month: number, year: number;
    if (typeof dateOnly === 'object' && typeof dateOnly.toDate === 'function') {
      const asDate: Date = dateOnly.toDate();
      day = asDate.getDate();
      month = asDate.getMonth() + 1;
      year = asDate.getFullYear();
    } else if (dateOnly instanceof Date) {
      day = dateOnly.getDate();
      month = dateOnly.getMonth() + 1;
      year = dateOnly.getFullYear();
    } else {
      [day, month, year] = String(dateOnly).split('/').map((part) => Number(part));
    }
    const [hours, minutes] = (time || '00:00').split(':').map((part) => Number(part));
    return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0);
  }

  private splitDateAndTime(date: string | Date | null | undefined): {
    dateOnly: Date | null;
    time: string;
  } {
    if (!date) {
      return { dateOnly: null, time: '' };
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return { dateOnly: null, time: '' };
    }
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return { dateOnly: d, time: `${hours}:${minutes}` };
  }
}
