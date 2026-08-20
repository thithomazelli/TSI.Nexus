import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService, PhotoService, User, UserService } from '@friday/core';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../../../shared/header/header.component';
import { PhotoComponent } from '../../../shared/photo/photo.component';
import { NgIf } from '@angular/common';
import { UserFormComponent } from '../user-form/user-form.component';
import { AttachmentsComponent } from '../../../shared/attachments/attachments.component';
import { UserPreferencesComponent } from '../../../shared/components/user-preferences/user-preferences.component';
import { AuditTabComponent } from '../../../shared/components/audit-tab/audit-tab.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-user-details-page',
    templateUrl: './user-details-page.component.html',
    styleUrl: './user-details-page.component.scss',
    imports: [
        HeaderComponent,
        PhotoComponent,
        NgIf,
        UserFormComponent,
        AttachmentsComponent,
        UserPreferencesComponent,
        AuditTabComponent,
        TranslatePipe,
    ],
})
export class UserDetailsPageComponent {
  isEdit = false;
  data?: User | null = null;
  id: string | null = null;
  loading = false;
  activeTab: 'details' | 'attachments' | 'preferences' | 'audit' = 'details';
  isOwnProfile = false;

  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private routerService: Router,
    private photoService: PhotoService,
    private userService: UserService,
    private accountService: AccountService,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      const idParam = params.get('id');

      if (idParam && idParam !== 'new') {
        this.isEdit = true;
        this.id = idParam;
        this.getUserById(idParam);
      } else {
        this.isEdit = false;
        this.data = null;
      }
    });

    this.photoService.photo$.subscribe((response) => {
      if (response.photoPath) {
        this.data!.photo = response.photoPath;
      }
    });

    this.accountService.user$.subscribe((currentUser) => {
      this.isOwnProfile = !!currentUser && currentUser.id === this.id;
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private getUserById(id: string): void {
    this.loading = true;
    this.userService
      .getById(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.data == null) {
            this.routerService.navigateByUrl('/not-found');
            return;
          }
          this.data = response.data;
        },
        error: () => {
          this.loading = false;
          this.routerService.navigateByUrl('/not-found');
        },
      });
  }
}
