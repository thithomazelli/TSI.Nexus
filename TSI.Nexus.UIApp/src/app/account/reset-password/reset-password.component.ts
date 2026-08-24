import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  AccountService,
  FormBaseComponent,
  ModalService,
  ResetPassword,
  User,
} from '@nexus/core';
import { UserDetailsModalComponent } from '../../users/components/user-details-modal/user-details-modal.component';
import { UserDetailsPageComponent } from '../../users/components/user-details-page/user-details-page.component';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  standalone: false,
})
export class ResetPasswordComponent
  extends FormBaseComponent
  implements OnInit, OnChanges
{
  @Input()
  data?: User;

  @Output() saved = new EventEmitter<any>();

  passwordVisible = false;

  constructor(
    private accountService: AccountService,
    private modalService: ModalService,
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<
      UserDetailsModalComponent | UserDetailsPageComponent
    >,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    super();
    if (dialogData) {
      this.data = dialogData.data;
    }
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['data'] && !changes['data'].firstChange) ||
      (changes['isEdit'] && !changes['isEdit'].firstChange)
    ) {
      this.initializeForm();
    }
  }

  initializeForm(): void {
    this.form = this.formBuilder.group({
      email: [{ value: this.data?.email, disabled: true }],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(15),
        ],
      ],
    });
  }

  resetPassword(): void {
    this.submitted = true;
    this.errorMessages = [];

    const resetPassword = <ResetPassword>{
      token: '123',
      email: this.data?.email,
      newPassword: this.form.get('newPassword')?.value,
    };

    this.accountService.resetPassword(resetPassword).subscribe({
      next: (response: any) => {
        this.saved.emit(response);
        this.dialogRef.close(response);
      },
      error: (response: any) => {
        if (response.error.errors) {
          this.errorMessages = response.error.errors;
        } else {
          this.errorMessages.push(response.error);
        }
      },
    });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  close(): void {
    this.modalService.hideModal(this.dialogRef);
  }
}
