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
  Passenger,
  PassengerService,
  WebApiResponse,
} from '@friday/core';
import { Subject, takeUntil } from 'rxjs';

import { PassengerDetailsModalComponent } from '../passenger-details-modal/passenger-details-modal.component';
import { PassengerImportComponent } from '../passenger-import/passenger-import.component';

@Component({
  selector: 'app-passenger-list',
  templateUrl: './passenger-list.component.html',
  styleUrl: './passenger-list.component.scss',
  standalone: false,
})
export class PassengerListComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  tripId!: string;

  passengers: Passenger[] = [];

  private _destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private passengerService: PassengerService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.passengerService.passengerChanged$
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

  openModal(passenger?: Passenger): void {
    this.modalService.showTemplateModal(PassengerDetailsModalComponent, {
      tripId: this.tripId,
      data: passenger ?? null,
    });
  }

  openImportModal(): void {
    this.modalService.showTemplateModal(PassengerImportComponent, {
      tripId: this.tripId,
    });
  }

  removePassenger(passenger: Passenger): void {
    this.passengerService
      .delete(passenger)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Passenger>) => {
        this.notificationService.showMessage(response.status, response.message);
      });
  }

  private load(): void {
    if (!this.tripId) {
      return;
    }
    this.passengerService
      .getByTrip(this.tripId)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response) => {
        this.passengers = response.data ?? [];
      });
  }
}
