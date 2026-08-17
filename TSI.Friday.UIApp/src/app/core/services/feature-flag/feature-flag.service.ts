import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  ApiService,
  ApiType,
  FeatureToggle,
  FeatureToggleKeys,
  WebApiResponse,
} from '@friday/core';

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  private _baseEndPoint = ApiType.FeatureToggles;
  private _toggles$ = new BehaviorSubject<FeatureToggle[]>([]);
  private _loaded = false;

  constructor(private apiService: ApiService) {}

  refresh(): Observable<FeatureToggle[]> {
    return this.apiService
      .get<WebApiResponse<FeatureToggle[]>>(`${this._baseEndPoint}/getAll`)
      .pipe(
        map((response) => response.data ?? []),
        tap((toggles) => {
          this._toggles$.next(toggles);
          this._loaded = true;
        }),
      );
  }

  /**
   * Returns whether the module identified by key is enabled. Fails open (true) both when the
   * toggle isn't registered yet and while it's still loading, so a slow/failed request never
   * hides an unrelated module by accident - the same fail-open policy used server-side.
   */
  isEnabled(key: string): Observable<boolean> {
    const source$ = this._loaded ? of(this._toggles$.value) : this.refresh();
    return source$.pipe(
      map((toggles) => {
        const toggle = toggles.find((t) => t.key === key);
        return toggle ? toggle.enabled !== false : true;
      }),
    );
  }

  isFleetModuleEnabled(): Observable<boolean> {
    return this.isEnabled(FeatureToggleKeys.FleetModule);
  }

  setEnabled(key: string, enabled: boolean): Observable<WebApiResponse<FeatureToggle>> {
    return this.apiService
      .put<WebApiResponse<FeatureToggle>>(
        `${this._baseEndPoint}/setEnabled/${key}/${enabled}`,
        null,
      )
      .pipe(tap(() => this.refresh().subscribe()));
  }

  getAll(): Observable<WebApiResponse<FeatureToggle[]>> {
    return this.apiService.get<WebApiResponse<FeatureToggle[]>>(
      `${this._baseEndPoint}/getAll`,
    );
  }
}
