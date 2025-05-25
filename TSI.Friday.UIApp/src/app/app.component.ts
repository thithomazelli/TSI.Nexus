import { Component, OnInit } from '@angular/core';
import { AccountService } from './core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    standalone: false
})
export class AppComponent implements OnInit {
  constructor(private accountService: AccountService) {}

  ngOnInit(): void {
    this.refreshUser();
  }

  private refreshUser(): void {
    const jwt = this.accountService.getJWT();

    if (jwt) {
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
}
