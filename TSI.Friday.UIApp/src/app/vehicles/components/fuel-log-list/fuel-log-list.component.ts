import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  FuelLog,
  FuelLogService,
  ModalService,
  NotificationService,
  WebApiResponse,
} from '@friday/core';
import { Subject, takeUntil } from 'rxjs';

import { FuelLogDetailsModalComponent } from '../fuel-log-details-modal/fuel-log-details-modal.component';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-fuel-log-list',
    templateUrl: './fuel-log-list.component.html',
    styleUrl: './fuel-log-list.component.scss',
    imports: [
        CurrencyPipe,
        DatePipe,
        TranslatePipe,
    ],
})
export class FuelLogListComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  vehicleId!: string;

  fuelLogs: FuelLog[] = [];

  private _destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private fuelLogService: FuelLogService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.load();
    this.fuelLogService.fuelLogChanged$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => this.load());
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

  openModal(fuelLog?: FuelLog): void {
    this.modalService.showTemplateModal(FuelLogDetailsModalComponent, {
      vehicleId: this.vehicleId,
      data: fuelLog ?? null,
    });
  }

  removeFuelLog(fuelLog: FuelLog): void {
    this.fuelLogService
      .delete(fuelLog)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<FuelLog>) => {
        this.notificationService.showMessage(response.status, response.message);
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
