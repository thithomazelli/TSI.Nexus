import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../services/translation/translation.service';

@Pipe({
  name: 'translate',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  constructor(private translationService: TranslationService) {}

  transform(
    key: string | null | undefined,
    params?: Record<string, string>,
  ): string {
    if (!key) {
      return '';
    }
    return this.translationService.instant(key, params);
  }
}
