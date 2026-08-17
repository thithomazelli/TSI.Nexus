import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  ModalService,
  NotificationService,
  ResponseStatus,
  TripLeg,
  TripLegService,
  WebApiResponse,
} from '@friday/core';
import { Subject, takeUntil } from 'rxjs';

import { TripLegDetailsModalComponent } from '../trip-leg-details-modal/trip-leg-details-modal.component';

@Component({
  selector: 'app-trip-leg-list',
  templateUrl: './trip-leg-list.component.html',
  styleUrl: './trip-leg-list.component.scss',
  standalone: false,
})
export class TripLegListComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  tripId!: string;

  tripLegs: TripLeg[] = [];

  private _destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private tripLegService: TripLegService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.tripLegService.tripLegChanged$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => this.load());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tripId'] && !changes['tripId'].firstChange) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  openModal(): void {
    this.modalService.showTemplateModal(TripLegDetailsModalComponent, {
      tripId: this.tripId,
      nextSequenceNumber: this.tripLegs.length + 1,
    });
  }

  removeTripLeg(tripLeg: TripLeg): void {
    this.tripLegService
      .delete(tripLeg)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<TripLeg>) => {
        this.notificationService.showMessage(response.status, response.message);
      });
  }

  private load(): void {
    if (!this.tripId) {
      return;
    }
    this.tripLegService
      .getByTrip(this.tripId)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response) => {
        this.tripLegs = response.data ?? [];
      });
  }
}
