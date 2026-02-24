// ...existing code...
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { Observable } from 'rxjs';
import { AccountService, PhotoService, User } from '@friday/core';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: false,
})
export class NavbarComponent implements OnInit, AfterViewInit, OnDestroy {
  isFullscreen = false;
  imageUrl: string = '';
  data: User | null = null;

  private mobileBreakpoint = 992;
  private resizeUnlisten: (() => void) | null = null;

  // simple overlay refs
  private overlayEl: HTMLElement | null = null;
  private overlayClickUnlisten: (() => void) | null = null;

  constructor(
    private renderer: Renderer2,
    private accountService: AccountService,
    private photoService: PhotoService,
  ) {}

  get user$(): Observable<User | null> {
    return this.accountService.user$;
  }

  async toggleFullscreen(): Promise<void> {
    const doc: any = document;
    try {
      if (!doc.fullscreenElement) {
        await (document.documentElement as any).requestFullscreen();
        this.isFullscreen = true;
      } else {
        await doc.exitFullscreen();
        this.isFullscreen = false;
      }
    } catch {
      /* swallow fullscreen errors */
    }
  }

  ngOnInit(): void {
    this.photoService.photo$.subscribe((fileName: string) => {
      if (fileName) {
        const apiBase = environment.appUrl; // ajuste conforme seu ambiente
        this.imageUrl = `${apiBase}/uploads/User/${fileName}`;
        this.data!.photo = fileName;
      }
    });

    this.user$.subscribe((user) => {
      this.data = user;

      if (user?.photo) {
        const apiBase = environment.appUrl; // ajuste conforme seu ambiente
        this.imageUrl = `${apiBase}/uploads/User/${user.photo}`;
        return;
      }

      this.imageUrl = 'assets/img/no_profile.png';
    });
  }

  ngAfterViewInit(): void {
    this.applyResponsiveState(window.innerWidth);
    this.resizeUnlisten = this.renderer.listen(
      'window',
      'resize',
      (ev: UIEvent) =>
        this.applyResponsiveState((ev.target as Window).innerWidth),
    );
  }

  ngOnDestroy(): void {
    if (this.resizeUnlisten) {
      try {
        this.resizeUnlisten();
      } catch {}
      this.resizeUnlisten = null;
    }
    this.removeOverlay(true);
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/img/no_profile.png';
  }

  toggleSidebar(): void {
    const body = document.body;
    const sidebarExists = !!document.querySelector(
      '.app-sidebar, .main-sidebar, .sidebar',
    );

    if (window.innerWidth < this.mobileBreakpoint) {
      // Mobile overlay flow: open -> remove collapse then add open; close -> remove open then add collapse.
      if (body.classList.contains('sidebar-open')) {
        // close: remove open first so CSS transform transition runs
        requestAnimationFrame(() => {
          this.renderer.removeClass(body, 'sidebar-open');
          this.renderer.addClass(body, 'sidebar-collapse');
        });
        // hide overlay (keep in DOM to allow transition)
        this.hideOverlay();
      } else {
        // open
        this.renderer.removeClass(body, 'sidebar-collapse');
        this.renderer.addClass(body, 'sidebar-open');
        this.ensureOverlay();
        // show overlay (trigger opacity transition)
        requestAnimationFrame(() => this.overlayEl?.classList.add('visible'));
      }
    } else {
      // Desktop: persistent collapse toggle; no overlay
      if (body.classList.contains('sidebar-collapse')) {
        this.renderer.removeClass(body, 'sidebar-collapse');
      } else {
        this.renderer.addClass(body, 'sidebar-collapse');
      }
      this.removeOverlay(true);
    }

    // If there is no sidebar element, ensure overlay removed to avoid stale UI
    if (!sidebarExists && !body.classList.contains('sidebar-open')) {
      this.removeOverlay(true);
    }
  }

  logout(): void {
    this.accountService.logout();
  }

  private applyResponsiveState(width: number): void {
    const body = document.body;
    if (width < this.mobileBreakpoint) {
      this.renderer.addClass(body, 'sidebar-collapse');
      this.renderer.removeClass(body, 'sidebar-open');
      this.removeOverlay();
    } else {
      this.renderer.removeClass(body, 'sidebar-collapse');
      this.renderer.removeClass(body, 'sidebar-open');
      this.removeOverlay();
    }
  }

  private ensureOverlay(): void {
    if (this.overlayEl) return;
    const wrapper = document.querySelector('.app-wrapper') || document.body;
    const div = document.createElement('div');
    div.className = 'sidebar-overlay';
    wrapper.appendChild(div);
    this.overlayEl = div;

    const onClick = (ev: Event) => {
      ev.preventDefault();
      // close sidebar on overlay click
      this.toggleSidebar();
    };
    div.addEventListener('click', onClick);
    this.overlayClickUnlisten = () => div.removeEventListener('click', onClick);
  }

  private hideOverlay(): void {
    if (!this.overlayEl) return;
    this.overlayEl.classList.remove('visible');
    // don't remove DOM immediately: allow CSS transition to finish
    // remove after a short delay if app doesn't use transitionend
    setTimeout(() => {
      if (this.overlayEl && !this.overlayEl.classList.contains('visible')) {
        this.removeOverlay(true);
      }
    }, 500);
  }

  private removeOverlay(forceRemove = false): void {
    if (!this.overlayEl) return;
    const el = this.overlayEl;

    if (this.overlayClickUnlisten) {
      try {
        this.overlayClickUnlisten();
      } catch {}
      this.overlayClickUnlisten = null;
    }

    const doRemove = () => {
      try {
        if (el.parentElement) el.parentElement.removeChild(el);
      } catch {}
      if (this.overlayEl === el) this.overlayEl = null;
    };

    if (forceRemove) {
      doRemove();
      return;
    }

    // remove visible class and wait a short time before removing DOM
    el.classList.remove('visible');
    const onEnd = () => {
      doRemove();
      el.removeEventListener('transitionend', onEnd);
    };
    el.addEventListener('transitionend', onEnd);
    // fallback
    setTimeout(() => {
      if (this.overlayEl === el) doRemove();
    }, 800);
  }
}
