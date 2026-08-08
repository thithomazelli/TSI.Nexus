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
  mode: 'single' | 'multi' = 'single';
  saving = false;

  orderId: string;
  private _nextSequenceNumber: number;

  singleForm: FormGroup;
  multiForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<TripLegDetailsModalComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private formBuilder: FormBuilder,
    private tripLegService: TripLegService,
    private notificationService: NotificationService,
  ) {
    this.orderId = dialogData?.orderId ?? '';
    this._nextSequenceNumber = dialogData?.nextSequenceNumber ?? 1;

    this.singleForm = this.formBuilder.group({
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      departureDateOnly: ['', Validators.required],
      departureTime: [''],
      distanceKm: [0, [Validators.min(0)]],
      notes: [''],
    });

    this.multiForm = this.formBuilder.group({
      origin: ['', Validators.required],
      stops: this.formBuilder.array([this.buildStopGroup()]),
    });
  }

  get stops(): FormArray {
    return this.multiForm.get('stops') as FormArray;
  }

  setMode(mode: 'single' | 'multi'): void {
    this.mode = mode;
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

  submitSingle(): void {
    if (this.singleForm.invalid || this.saving) {
      this.singleForm.markAllAsTouched();
      return;
    }

    const raw = this.singleForm.getRawValue();
    const tripLeg = {
      id: '',
      sequenceNumber: this._nextSequenceNumber,
      origin: raw.origin,
      destination: raw.destination,
      departureDate: this.combineDateAndTime(raw.departureDateOnly!, raw.departureTime),
      distanceKm: raw.distanceKm ?? 0,
      notes: raw.notes ?? '',
      orderId: this.orderId,
    } as TripLeg;

    this.saving = true;
    this.tripLegService.add(tripLeg).subscribe({
      next: (response: WebApiResponse<TripLeg>) => {
        this.saving = false;
        this.notificationService.showMessage(response.status, response.message);
        if (response.status === ResponseStatus.Success) {
          this.dialogRef.close(response);
        }
      },
      error: () => {
        this.saving = false;
        this.notificationService.showMessage(ResponseStatus.Error, 'Erro ao salvar trecho.');
      },
    });
  }

  submitMulti(): void {
    if (this.multiForm.invalid || this.saving) {
      this.multiForm.markAllAsTouched();
      return;
    }

    const raw = this.multiForm.getRawValue();
    const legs: TripLeg[] = [];
    let previousPoint = raw.origin!;

    (raw.stops ?? []).forEach((stop: any, index: number) => {
      legs.push({
        id: '',
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
          `${legs.length} trecho(s) adicionado(s) com sucesso.`,
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
   * app-date-field carries a "DD/MM/YYYY" string; combines it with an optional "HH:mm" time input
   * into a single Date, since TripLeg.departureDate is a full datetime.
   */
  private combineDateAndTime(dateOnly: string | null, time?: string | null): Date {
    if (!dateOnly) {
      return new Date();
    }
    const [day, month, year] = dateOnly.split('/').map((part) => Number(part));
    const [hours, minutes] = (time || '00:00').split(':').map((part) => Number(part));
    return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0);
  }
}
