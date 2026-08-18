import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'app-theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private _theme$ = new BehaviorSubject<AppTheme>(this.readInitialTheme());

  theme$ = this._theme$.asObservable();

  get current(): AppTheme {
    return this._theme$.value;
  }

  constructor() {
    this.apply(this.current);
  }

  /** Applies a theme locally (DOM + localStorage) without touching the backend. */
  apply(theme: AppTheme): void {
    document.documentElement.setAttribute('data-bs-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage errors (private browsing, quota, etc.)
    }
    this._theme$.next(theme);
  }

  toggle(): AppTheme {
    const next: AppTheme = this.current === 'dark' ? 'light' : 'dark';
    this.apply(next);
    return next;
  }

  private readInitialTheme(): AppTheme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch {
      // ignore storage errors
    }
    return 'light';
  }
}
