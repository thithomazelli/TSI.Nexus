import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay, startWith, switchMap, tap } from 'rxjs/operators';
import {
  ApiService,
  ApiType,
  FeatureToggle,
  FeatureToggleKeys,
  WebApiResponse,
} from '@nexus/core';

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  private _baseEndPoint = ApiType.FeatureToggles;
  private _refresh$ = new Subject<void>();

  /**
   * Single source of truth for every consumer (sidebar, navbar, every module tab across the
   * app). shareReplay(1) is the whole mechanism: the first subscriber triggers the fetch, every
   * other subscriber - however many isEnabled() calls happen to land in the same tick - shares
   * that one in-flight request instead of firing its own (sidebar + navbar alone used to fire
   * ~16 near-simultaneous GET requests on every page load), and once it resolves every later
   * subscriber (a route change, a newly-mounted component) just replays the cached array with
   * no new request and no re-render, since nothing about the toggle set actually changed.
   * _refresh$ is the only way this ever re-fetches - pushed after an admin edit via setEnabled().
   */
  readonly toggles$: Observable<FeatureToggle[]> = this._refresh$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.apiService
        .get<WebApiResponse<FeatureToggle[]>>(`${this._baseEndPoint}/getAll`)
        .pipe(map((response) => response.data ?? [])),
    ),
    shareReplay(1),
  );

  constructor(private apiService: ApiService) {}

  refresh(): void {
    this._refresh$.next();
  }

  /**
   * Returns whether the module identified by key is enabled. Fails open (true) when the toggle
   * isn't registered, so a slow/failed request never hides an unrelated module by accident - the
   * same fail-open policy used server-side. While toggles$ hasn't emitted yet this simply hasn't
   * emitted either - callers gate visibility on that (e.g. *ngIf="... | async", which treats "no
   * emission yet" as falsy) rather than on a guessed default, which is what used to let disabled
   * modules flash visible before the real state arrived.
   */
  isEnabled(key: string): Observable<boolean> {
    return this.toggles$.pipe(
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
      .pipe(tap(() => this.refresh()));
  }

  getAll(): Observable<WebApiResponse<FeatureToggle[]>> {
    return this.apiService.get<WebApiResponse<FeatureToggle[]>>(
      `${this._baseEndPoint}/getAll`,
    );
  }
}
