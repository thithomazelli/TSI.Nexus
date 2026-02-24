import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AccountService,
  FormBaseComponent,
  ModalService,
  ResetPassword,
  User,
} from '@friday/core';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent
  extends FormBaseComponent
  implements OnInit
{
  email: string | undefined = 'leonardothomazellif@gmail.com';
  passwordVisible = false;

  constructor(
    private accountService: AccountService,
    private modalService: ModalService,
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.form = this.formBuilder.group({
      email: [{ value: this.email, disabled: true }],
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
      email: this.email,
      newPassword: this.form.get('newPassword')?.value,
    };

    this.accountService.resetPassword(resetPassword).subscribe({
      next: (response: any) => {
        this.modalService.showNotification(
          true,
          response.value.title,
          response.value.message,
        );
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
}
