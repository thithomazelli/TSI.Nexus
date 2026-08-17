import { Component, OnInit } from '@angular/core';
import {
  FeatureFlagService,
  FeatureToggle,
  NotificationService,
  ResponseStatus,
} from '@friday/core';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-feature-toggles',
  templateUrl: './feature-toggles.component.html',
  styleUrl: './feature-toggles.component.scss',
  standalone: false,
})
export class FeatureTogglesComponent implements OnInit {
  toggles: FeatureToggle[] = [];
  loading = false;
  savingKey: string | null = null;

  constructor(
    private featureFlagService: FeatureFlagService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  toggle(featureToggle: FeatureToggle): void {
    if (!featureToggle.key || this.savingKey) {
      return;
    }
    const nextEnabled = !featureToggle.enabled;
    this.savingKey = featureToggle.key;

    this.featureFlagService
      .setEnabled(featureToggle.key, nextEnabled)
      .pipe(finalize(() => (this.savingKey = null)))
      .subscribe({
        next: (response) => {
          if (response.status === ResponseStatus.Success && response.data) {
            featureToggle.enabled = response.data.enabled;
          }
          this.notificationService.showMessage(
            response.status,
            response.message,
          );
        },
        error: () => {
          this.notificationService.showMessage(
            'Error',
            'Não foi possível atualizar o módulo.',
          );
        },
      });
  }

  private load(): void {
    this.loading = true;
    this.featureFlagService.getAll().subscribe({
      next: (response) => {
        this.toggles = response.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
