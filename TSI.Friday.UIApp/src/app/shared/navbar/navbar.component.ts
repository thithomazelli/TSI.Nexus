import { Component } from '@angular/core';
import { AccountService, User } from '@friday/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  standalone: false,
})
export class NavbarComponent {
  // collapsed controla visibilidade da sidebar
  collapsed = false;

  constructor(private accountService: AccountService) {}

  get user$(): Observable<User | null> {
    return this.accountService.user$;
  }

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
  }

  logout(): void {
    this.accountService.logout();
  }
}
