import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  AccountService,
  FormBaseComponent,
  ModalService,
  User,
} from '@friday/core';
import { ResetPasswordComponent } from '../../../account/reset-password/reset-password.component';

@Component({
  selector: 'app-user-form',
  standalone: false,
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges, OnDestroy
{
  @Input()
  isEdit = false;

  @Input()
  data?: User | null;

  @Input()
  compact = false;

  @Input()
  errors: string[] | undefined;

  @Output()
  save = new EventEmitter<User>();

  @Output()
  cancel = new EventEmitter<void>();

  roleOptions = [
    { label: 'Administrador', value: 'Admin' },
    { label: 'Usuário', value: 'User' },
  ];

  isResendingEmail = false;
  resendEmailCountdown = 0;
  private resendEmailTimer: any;
  readonly RESEND_EMAIL_COOLDOWN_MS = 60000;

  constructor(
    private formBuilder: FormBuilder,
    private accountService: AccountService,
    private modalService: ModalService,
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
    if (this.resendEmailTimer) {
      clearInterval(this.resendEmailTimer);
    }
  }

  submit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.value as User);
  }

  doCancel(): void {
    this.cancel.emit();
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

  private resetResendEmailCooldown(): void {
    if (this.resendEmailTimer) {
      clearInterval(this.resendEmailTimer);
    }

    this.resendEmailCountdown = Math.ceil(this.RESEND_EMAIL_COOLDOWN_MS / 1000);

    this.resendEmailTimer = setInterval(() => {
      this.resendEmailCountdown--;
      if (this.resendEmailCountdown <= 0) {
        clearInterval(this.resendEmailTimer);
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
    const remainingTime = this.RESEND_EMAIL_COOLDOWN_MS - elapsedTime;

    if (remainingTime > 0) {
      this.isResendingEmail = true;
      this.resendEmailCountdown = Math.ceil(remainingTime / 1000);

      if (this.resendEmailTimer) {
        clearInterval(this.resendEmailTimer);
      }

      this.resendEmailTimer = setInterval(() => {
        this.resendEmailCountdown--;
        if (this.resendEmailCountdown <= 0) {
          clearInterval(this.resendEmailTimer);
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
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
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
          password: ['', [Validators.required]],
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
}
