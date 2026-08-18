import { Component, Input } from '@angular/core';
import {
  AppLanguage,
  NotificationService,
  PreferencesService,
  ThemeService,
  TranslationService,
} from '@friday/core';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-user-preferences',
  templateUrl: './user-preferences.component.html',
  styleUrl: './user-preferences.component.scss',
  standalone: false,
})
export class UserPreferencesComponent {
  /** Compact mode drops the title/description, used inside the navbar dropdown. */
  @Input() compact = false;

  saving = false;

  constructor(
    public themeService: ThemeService,
    public translationService: TranslationService,
    private preferencesService: PreferencesService,
    private notificationService: NotificationService,
  ) {}

  onThemeToggle(): void {
    this.themeService.toggle();
    this.persist();
  }

  onLanguageChange(language: AppLanguage): void {
    this.translationService.use(language);
    this.persist();
  }

  private persist(): void {
    this.saving = true;
    this.preferencesService
      .update({
        theme: this.themeService.current,
        language: this.translationService.current,
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        error: () => {
          this.notificationService.showMessage(
            'Error',
            this.translationService.instant('PREFERENCES.ERROR'),
          );
        },
      });
  }
}
