import { Component, OnInit, Renderer2 } from '@angular/core';
import { AccountService } from './core';
import { filter, map, Observable, Subscription } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false,
})
export class AppComponent implements OnInit {
  private sub?: Subscription;
  private applied: string[] = [];

  // expose login state for template
  isLoggedIn$: Observable<boolean>;

  constructor(
    private router: Router,
    private renderer: Renderer2,
    private accountService: AccountService
  ) {
    this.isLoggedIn$ = this.accountService.user$.pipe(map((u) => !!u));
  }

  ngOnInit(): void {
    this.sub = this.router.events
      .pipe(filter((evt) => evt instanceof NavigationEnd))
      .subscribe((evt: NavigationEnd) => {
        const url = evt.urlAfterRedirects || evt.url;
        let classes: string[] = [];

        if (url.startsWith('/account/register'))
          classes = ['register-page', 'bg-body-secondary'];
        else if (url.startsWith('/account'))
          classes = ['login-page', 'bg-body-secondary'];

        this.updateBodyClass(classes);
      });
  }

  private updateBodyClass(classes: string[]) {
    this.applied.forEach((c) => this.renderer.removeClass(document.body, c));
    this.applied = [];
    classes.forEach((c) => {
      this.renderer.addClass(document.body, c);
      this.applied.push(c);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.applied.forEach((c) => this.renderer.removeClass(document.body, c));
  }
}
