import { Component, OnInit, Renderer2, OnDestroy, NgZone } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AccountService, TranslationService } from './core';
import { filter, map, Observable, Subscription } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '../environments/environment';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  private sub?: Subscription;
  private applied: string[] = [];
  private lastRefresh = 0;
  private refreshIntervalMs: number;

  // expose login state for template
  isLoggedIn$: Observable<boolean>;

  private activityEvents = [
    'mousemove',
    'mousedown',
    'keydown',
    'touchstart',
    'scroll',
  ];
  private activityUnlisteners: Array<() => void> = [];

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private accountService: AccountService,
    private ngZone: NgZone,
    private swUpdate: SwUpdate,
    private titleService: Title,
    private translationService: TranslationService,
  ) {
    this.isLoggedIn$ = this.accountService.user$.pipe(map((u) => !!u));

    // read interval from environment (seconds) with fallback to 30 seconds
    const sec = (environment && environment.tokenRefreshIntervalSeconds) ?? 30;
    this.refreshIntervalMs = Number(sec) * 1000;
  }

  ngOnInit(): void {
    this.titleService.setTitle(this.translationService.instant('APP_TITLE'));
    this.translationService.language$.subscribe(() =>
      this.titleService.setTitle(this.translationService.instant('APP_TITLE')),
    );

    // Ativa automaticamente uma nova versão publicada assim que o service worker a detecta,
    // em vez de deixar o usuário preso na versão antiga em cache até fechar todas as abas.
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          filter(
            (evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY',
          ),
        )
        .subscribe(() => {
          this.swUpdate.activateUpdate().then(() => document.location.reload());
        });
    }

    // Adiciona listeners de atividade do usuário para resetar autologoff
    this.ngZone.runOutsideAngular(() => {
      this.activityEvents.forEach((event) => {
        const unlisten = this.renderer.listen('document', event, () => {
          // Só reseta se estiver logado
          const jwt = this.accountService.getJWT();
          if (jwt) {
            this.accountService.startAutoLogout(jwt);
          }
        });
        this.activityUnlisteners.push(unlisten);
      });
    });
    this.refreshUser();
    this.sub = this.router.events
      .pipe(filter((evt) => evt instanceof NavigationEnd))
      .subscribe((evt: NavigationEnd) => {
        const url = evt.urlAfterRedirects || evt.url;
        let classes: string[] = [];

        if (url.startsWith('/account/register'))
          classes = ['register-page', 'bg-body-secondary'];
        else if (url.startsWith('/account/login'))
          classes = ['login-page', 'bg-body-secondary'];

        this.updateBodyClass(classes);

        // attempt to refresh token on every navigation except account pages
        this.checkRefreshOnNavigation(url);
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.applied.forEach((c) => this.renderer.removeClass(document.body, c));
    // Remove listeners de atividade
    this.activityUnlisteners.forEach((unlisten) => {
      try {
        unlisten();
      } catch {}
    });
    this.activityUnlisteners = [];
  }

  private updateBodyClass(classes: string[]) {
    this.applied.forEach((c) => this.renderer.removeClass(document.body, c));
    this.applied = [];
    classes.forEach((c) => {
      this.renderer.addClass(document.body, c);
      this.applied.push(c);
    });
  }

  private refreshUser(): void {
    const jwt = this.accountService.getJWT();

    if (jwt) {
      // avoid calling refresh endpoint with expired token — logout instead
      if (this.accountService.isTokenExpired(jwt)) {
        this.accountService.logout();
        return;
      }

      this.accountService.refreshUser(jwt).subscribe({
        next: (_) => {},
        error: (_) => {
          this.accountService.logout();
        },
      });
    } else {
      this.accountService.refreshUser(null).subscribe();
    }
  }

  private checkRefreshOnNavigation(url: string): void {
    // do not attempt refresh on auth pages
    if (url.startsWith('/account')) {
      return;
    }

    // throttle by interval
    const now = Date.now();
    if (now - this.lastRefresh < this.refreshIntervalMs) {
      return;
    }

    const jwt = this.accountService.getJWT();
    if (!jwt) {
      return;
    }

    // if token expired, force logout immediately
    if (this.accountService.isTokenExpired(jwt)) {
      this.accountService.logout();
      return;
    }

    this.accountService.refreshUser(jwt).subscribe({
      next: () => {
        this.lastRefresh = Date.now();
      },
      error: () => {
        this.lastRefresh = Date.now();
        this.accountService.logout();
      },
    });
  }
}
