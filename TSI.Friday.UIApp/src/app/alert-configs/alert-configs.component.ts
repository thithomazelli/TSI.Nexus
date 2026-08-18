import { Component, OnInit } from '@angular/core';
import {
  AlertConfig,
  AlertConfigService,
  NotificationService,
  ResponseStatus,
} from '@friday/core';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-alert-configs',
  templateUrl: './alert-configs.component.html',
  styleUrl: './alert-configs.component.scss',
  standalone: false,
})
export class AlertConfigsComponent implements OnInit {
  alerts: AlertConfig[] = [];
  loading = false;
  savingKey: string | null = null;

  constructor(
    private alertConfigService: AlertConfigService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  toggle(alertConfig: AlertConfig): void {
    if (!alertConfig.key || this.savingKey) {
      return;
    }
    const nextEnabled = !alertConfig.enabled;
    this.savingKey = alertConfig.key;

    this.alertConfigService
      .setEnabled(alertConfig.key, nextEnabled)
      .pipe(finalize(() => (this.savingKey = null)))
      .subscribe({
        next: (response) => {
          if (response.status === ResponseStatus.Success && response.data) {
            alertConfig.enabled = response.data.enabled;
          }
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
        },
        error: () => {
          this.notificationService.showMessage(
            'Error',
            'Não foi possível atualizar o alerta.',
          );
        },
      });
  }

  saveThreshold(alertConfig: AlertConfig): void {
    if (
      !alertConfig.key ||
      this.savingKey ||
      alertConfig.thresholdDays == null ||
      alertConfig.thresholdDays < 1
    ) {
      return;
    }
    this.savingKey = alertConfig.key;

    this.alertConfigService
      .setThresholdDays(alertConfig.key, alertConfig.thresholdDays)
      .pipe(finalize(() => (this.savingKey = null)))
      .subscribe({
        next: (response) => {
          if (response.status === ResponseStatus.Success && response.data) {
            alertConfig.thresholdDays = response.data.thresholdDays;
          }
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
        },
        error: () => {
          this.notificationService.showMessage(
            'Error',
            'Não foi possível atualizar o prazo do alerta.',
          );
        },
      });
  }

  private load(): void {
    this.loading = true;
    this.alertConfigService.getAll().subscribe({
      next: (response) => {
        this.alerts = response.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
