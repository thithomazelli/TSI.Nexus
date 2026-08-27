import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService, PhotoService, User, UserService } from '@nexus/core';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../../../shared/header/header.component';
import { PhotoComponent } from '../../../shared/photo/photo.component';
import { NgIf } from '@angular/common';
import { UserFormComponent } from '../user-form/user-form.component';
import { AttachmentsComponent } from '../../../shared/attachments/attachments.component';
import { UserPreferencesComponent } from '../../../shared/components/user-preferences/user-preferences.component';
import { AuditTabComponent } from '../../../shared/components/audit-tab/audit-tab.component';
import { EventListComponent } from '../../../shared/components/event-list/event-list.component';
import { FeatureFlagService } from '../../../core/services/feature-flag/feature-flag.service';
import { FeatureToggleKeys } from '../../../core/models/feature-toggle.model';
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
        EventListComponent,
        TranslatePipe,
    ],
})
export class UserDetailsPageComponent {
  isEdit = false;
  data?: User | null = null;
  id: string | null = null;
  loading = false;
  activeTab: 'details' | 'attachments' | 'agenda' | 'preferences' | 'audit' = 'details';
  isOwnProfile = false;
  // Defaults hidden, not enabled: flips to the real value once the
  // combineLatest subscription below resolves - defaulting true showed the
  // Agenda tab immediately, then hid it a moment later if disabled.
  isAgendaEnabled = false;

  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private routerService: Router,
    private photoService: PhotoService,
    private userService: UserService,
    private accountService: AccountService,
    private featureFlagService: FeatureFlagService,
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.featureFlagService.isEnabled(FeatureToggleKeys.AgendaModule),
      this.featureFlagService.isEnabled(FeatureToggleKeys.Event),
    ])
      .pipe(takeUntil(this._destroy$))
      .subscribe(([groupEnabled, entityEnabled]) => {
        this.isAgendaEnabled = groupEnabled && entityEnabled;
      });
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
