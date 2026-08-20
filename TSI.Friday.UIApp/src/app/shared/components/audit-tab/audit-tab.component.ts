import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { User, UserService } from '@friday/core';

export interface Auditable {
  createUserId?: string | null;
  createDate?: Date | string | null;
  modifyUserId?: string | null;
  modifyDate?: Date | string | null;
}

@Component({
  selector: 'app-audit-tab',
  templateUrl: './audit-tab.component.html',
  styleUrl: './audit-tab.component.scss',
  standalone: false,
})
export class AuditTabComponent implements OnChanges {
  @Input()
  data?: Auditable | null;

  createUserName = '';
  modifyUserName = '';

  constructor(private userService: UserService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.resolveUserNames();
    }
  }

  private resolveUserNames(): void {
    this.createUserName = '';
    this.modifyUserName = '';

    const createUserId = this.data?.createUserId;
    if (createUserId) {
      this.userService.getById(createUserId).subscribe((response) => {
        this.createUserName = this.formatUserName(response.data);
      });
    }

    const modifyUserId = this.data?.modifyUserId;
    if (modifyUserId) {
      this.userService.getById(modifyUserId).subscribe((response) => {
        this.modifyUserName = this.formatUserName(response.data);
      });
    }
  }

  private formatUserName(user: User | null | undefined): string {
    if (!user) {
      return '';
    }
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return fullName || user.userName || '';
  }
}
