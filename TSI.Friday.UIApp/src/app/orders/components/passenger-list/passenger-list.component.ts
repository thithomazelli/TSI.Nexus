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

@Component({
  selector: 'app-passenger-list',
  templateUrl: './passenger-list.component.html',
  styleUrl: './passenger-list.component.scss',
  standalone: false,
})
export class PassengerListComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  orderId!: string;

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
    if (changes['orderId'] && !changes['orderId'].firstChange) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  openModal(passenger?: Passenger): void {
    this.modalService.showTemplateModal(PassengerDetailsModalComponent, {
      orderId: this.orderId,
      data: passenger ?? null,
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
    if (!this.orderId) {
      return;
    }
    this.passengerService
      .getByOrder(this.orderId)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response) => {
        this.passengers = response.data ?? [];
      });
  }
}
