import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';

import {
  AccountService,
  ApiType,
  FormBaseComponent,
  ModalService,
  NotificationService,
  ResponseStatus,
  User,
  UserService,
  TranslationService,
  WebApiResponse,
} from '@friday/core';

import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { UserDetailsModalComponent } from '../user-details-modal/user-details-modal.component';
import { ResetPasswordComponent } from '../../../account/reset-password/reset-password.component';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
  standalone: false,
})
export class UserFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input()
  isModal = false;

  @Input()
  isEdit = false;

  @Input()
  data?: User | null;

  @Input()
  compact = false;

  @Input()
  dialogRef?: MatDialogRef<UserDetailsModalComponent>;

  get roleOptions() {
    return [
      { label: this.translationService.instant('USERS.ROLE_ADMIN'), value: 'Admin' },
      { label: this.translationService.instant('USERS.ROLE_USER'), value: 'User' },
    ];
  }

  // roleOptions is a getter, so *ngFor's default identity-based tracking sees a brand new
  // array/objects on every change-detection pass and keeps destroying/recreating the <option>
  // elements - severe enough churn on a bound <select> to trip NG0103 (infinite change detection).
  trackByOptionValue(_index: number, option: { value: string; label: string }): string {
    return option.value;
  }

  isResendingEmail = false;
  resendEmailCountdown = 0;

  private _resendEmailTimer: any;
  private _resendEmailCooldownMs = 60000;

  private _baseEndPoint: ApiType = ApiType.Users;

  constructor(
    private accountService: AccountService,
    private formBuilder: FormBuilder,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private routerService: Router,
    private userService: UserService,
    private translationService: TranslationService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.restoreResendEmailCooldown();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue && this.form) {
      this.form.patchValue(changes['data'].currentValue);
    }

    if (changes['isEdit'] && !changes['isEdit'].firstChange) {
      this.initForm();
      this.restoreResendEmailCooldown();
    }
  }

  ngOnDestroy(): void {
    if (this._resendEmailTimer) {
      clearInterval(this._resendEmailTimer);
    }
  }

  submit(): Observable<WebApiResponse<User> | null> {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return of(null);
    }

    const rawValue = this.form.getRawValue();

    if (this.data) {
      Object.assign(this.data!, rawValue);
    }

    return this.save(rawValue as User).pipe(
      tap({
        next: (response: WebApiResponse<User>) => {
          // The backend reports business-rule failures as a 200 response with status Error and
          // data: null rather than an HTTP error, so this has to be checked before treating the
          // save as successful - otherwise savePage()/saveModal() crash reading .id off a null
          // response.data.
          if (response.status !== ResponseStatus.Success) {
            this.notificationService.showMessage(response.status, response.message);
            return;
          }
          if (this.isModal) {
            this.saveModal(response);
          } else {
            this.savePage(response);
          }
        },
        error: (err) => {
          this.notificationService.showMessage('error', 'Erro ao salvar');
        },
      }),
    );
  }

  cancel(): void {
    if (this.isModal) {
      this.modalService.hideModal(this.dialogRef);
    } else {
      this.routerService.navigateByUrl(`/${this._baseEndPoint}`);
    }
  }

  remove(): void {
    this.modalService.hideModal();
    this.modalService
      .showSweetConfirmation(
        '',
        'Deseja realmente excluir este registro?',
        'question',
      )
      .then((result: any) => {
        if (result.isConfirmed) {
          this.userService
            .delete(this.data as User)
            .pipe(
              tap({
                next: (response: WebApiResponse<User>) => {
                  if (this.isModal) {
                    this.modalService.hideModal();
                    this.modalService.showSweetNotification(
                      '',
                      response.message,
                      response.status,
                    );
                  } else {
                    this.modalService.showSweetNotification(
                      '',
                      response.message,
                      response.status,
                    );
                    if (response.status === ResponseStatus.Success) {
                      this.routerService.navigateByUrl(
                        `/${this._baseEndPoint}`,
                      );
                    }
                  }
                },
                error: (err) => {
                  this.notificationService.showMessage(
                    'error',
                    'Erro ao remover',
                  );
                },
              }),
            )
            .subscribe();
        } else {
          if (this.isModal) {
            const initialState = {
              isEdit: this.isEdit,
              data: this.data,
              id: this.data?.id,
            };
            this.modalService.showTemplateModal(
              UserDetailsModalComponent,
              initialState,
            );
          }
        }
      });
  }

  resendEmailConfirmation(): void {
    if (this.isResendingEmail) {
      return;
    }

    this.isResendingEmail = true;

    this.accountService
      .resendEmailConfirmation(this.form.get('email')?.value)
      .subscribe({
        next: (response: any) => {
          this.saveResendEmailCooldown();
          this.modalService.hideModal();
          this.modalService.showNotification(
            true,
            response.value.title,
            response.value.message,
          );
        },
        error: () => {
          this.resetResendEmailCooldown();
        },
        complete: () => {
          this.resetResendEmailCooldown();
        },
      });
  }

  forgotPassword(): void {
    const initialState = {
      data: this.data,
    };
    const ref = this.modalService.showTemplateModal(
      ResetPasswordComponent,
      initialState,
    );

    if (ref.componentInstance && ref.componentInstance.saved) {
      ref.componentInstance.saved.subscribe((response: any) => {
        this.modalService.showNotification(
          true,
          response.value.title,
          response.value.message,
        );
        ref.close();
      });
    }
  }

  private resetResendEmailCooldown(): void {
    if (this._resendEmailTimer) {
      clearInterval(this._resendEmailTimer);
    }

    this.resendEmailCountdown = Math.ceil(this._resendEmailCooldownMs / 1000);

    this._resendEmailTimer = setInterval(() => {
      this.resendEmailCountdown--;
      if (this.resendEmailCountdown <= 0) {
        clearInterval(this._resendEmailTimer);
        this.isResendingEmail = false;
        this.resendEmailCountdown = 0;
        localStorage.removeItem(this.getResendEmailCooldownKey());
      }
    }, 1000);
  }

  private saveResendEmailCooldown(): void {
    const timestamp = Date.now();
    localStorage.setItem(
      this.getResendEmailCooldownKey(),
      timestamp.toString(),
    );
  }

  private restoreResendEmailCooldown(): void {
    const email = this.form?.get('email')?.value;
    if (!email) {
      return;
    }

    const storedTimestamp = localStorage.getItem(
      this.getResendEmailCooldownKey(),
    );
    if (!storedTimestamp) {
      return;
    }

    const lastSendTime = parseInt(storedTimestamp, 10);
    const elapsedTime = Date.now() - lastSendTime;
    const remainingTime = this._resendEmailCooldownMs - elapsedTime;

    if (remainingTime > 0) {
      this.isResendingEmail = true;
      this.resendEmailCountdown = Math.ceil(remainingTime / 1000);

      if (this._resendEmailTimer) {
        clearInterval(this._resendEmailTimer);
      }

      this._resendEmailTimer = setInterval(() => {
        this.resendEmailCountdown--;
        if (this.resendEmailCountdown <= 0) {
          clearInterval(this._resendEmailTimer);
          this.isResendingEmail = false;
          this.resendEmailCountdown = 0;
          localStorage.removeItem(this.getResendEmailCooldownKey());
        }
      }, 1000);
    } else {
      localStorage.removeItem(this.getResendEmailCooldownKey());
    }
  }

  private getResendEmailCooldownKey(): string {
    const email = this.form?.get('email')?.value || this.data?.email || '';
    return `resendEmailCooldown_${email}`;
  }

  private initForm(): void {
    const commonControls = {
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(15),
        ],
      ],
      lastName: [
        '',
        [
          // maxLength must match RegisterDto.LastName's [StringLength(15, ...)] on the backend -
          // it was 30 here, so a 16-30 char last name passed client validation cleanly and only
          // failed after submit with a raw backend error.
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(15),
        ],
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,4}$'),
        ],
      ],
      photo: [''],
      role: ['User'],
    };

    this.form = !this.isEdit
      ? this.formBuilder.group({
          ...commonControls,
          // RegisterDto.Password is [StringLength(15, MinimumLength = 6)] on the backend - without
          // matching bounds here, a too-short or too-long password passes client validation and
          // only fails after submit with a raw backend error.
          password: [
            '',
            [Validators.required, Validators.minLength(6), Validators.maxLength(15)],
          ],
        })
      : this.formBuilder.group({
          id: [''],
          ...commonControls,
          emailConfirmed: ['', { disabled: true }],
        });

    this.form.get('emailConfirmed')?.disable();

    if (this.data) {
      this.form.patchValue(this.data);
    }
  }

  private save(user: User): Observable<WebApiResponse<User>> {
    return this.isEdit && this.data
      ? this.userService.update(user)
      : this.userService.add(user);
  }

  private saveModal(response: WebApiResponse<User>): void {
    this.dialogRef?.close(response);
    this.modalService.showSweetNotification(
      '',
      response.message,
      response.status,
    );
  }

  private savePage(response: WebApiResponse<User>): void {
    if (this.isEdit && this.data) {
      this.notificationService.showMessage(response.status, response.message);
      this.data = response.data;
    } else {
      this.routerService.navigateByUrl(
        `/${this._baseEndPoint}/${response.data.id}`,
      );
    }
  }
}
