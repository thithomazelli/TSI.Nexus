import { Component, Inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  NotificationService,
  ResponseStatus,
  TripLeg,
  TripLegService,
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

  orderId: string;
  private _nextSequenceNumber: number;

  form: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<TripLegDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private formBuilder: FormBuilder,
    private tripLegService: TripLegService,
    private notificationService: NotificationService,
  ) {
    this.orderId = dialogData?.orderId ?? '';
    this._nextSequenceNumber = dialogData?.nextSequenceNumber ?? 1;

    this.form = this.formBuilder.group({
      origin: ['', Validators.required],
      stops: this.formBuilder.array([this.buildStopGroup()]),
    });
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
        orderId: this.orderId,
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
            ? 'Trecho adicionado com sucesso.'
            : `${legs.length} trechos adicionados com sucesso.`,
        );
        this.dialogRef.close(responses);
      },
      error: () => {
        this.saving = false;
        this.notificationService.showMessage(
          ResponseStatus.Error,
          'Erro ao salvar os trechos do itinerário.',
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
}
