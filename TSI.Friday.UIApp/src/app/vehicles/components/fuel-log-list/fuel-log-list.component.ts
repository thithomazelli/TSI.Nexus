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
import { CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { HeaderComponent } from '../../../shared/header/header.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-fuel-log-list',
    templateUrl: './fuel-log-list.component.html',
    styleUrl: './fuel-log-list.component.scss',
    imports: [
        NgIf,
        CurrencyPipe,
        DatePipe,
        HeaderComponent,
        TranslatePipe,
    ],
})
export class FuelLogListComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  vehicleId?: string;

  @Input()
  compact = false;

  fuelLogs: FuelLog[] = [];

  statusColorMap: { [key: string]: string } = {
    'Concluído': 'success',
    'Agendado': 'info',
    'Cancelado': 'secondary',
  };

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

  getStatusColor(status: string): string {
    return this.statusColorMap[status] ?? 'secondary';
  }

  openModal(fuelLog?: FuelLog): void {
    this.modalService.showTemplateModal(FuelLogDetailsModalComponent, {
      vehicleId: fuelLog?.vehicleId ?? this.vehicleId,
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
    const request$ = this.vehicleId
      ? this.fuelLogService.getByVehicle(this.vehicleId)
      : this.fuelLogService.getAll();

    request$.pipe(takeUntil(this._destroy$)).subscribe((response) => {
      this.fuelLogs = response.data ?? [];
    });
  }
}
