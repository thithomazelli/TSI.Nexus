import { Component } from '@angular/core';
import { AccountService, User } from '@friday/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  constructor(private accountService: AccountService) {}

  get user$(): Observable<User | null> {
    return this.accountService.user$;
  }

  logout(): void {
    this.accountService.logout();
  }
}
