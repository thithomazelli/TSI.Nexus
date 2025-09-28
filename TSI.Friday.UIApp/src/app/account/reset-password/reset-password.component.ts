import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AccountService,
  FormBaseComponent,
  ModalService,
  ResetPassword,
  User,
} from '@friday/core';
import { take } from 'rxjs';

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
  resetPasswordForm: FormGroup = new FormGroup({});
  token: string | undefined;
  email: string | undefined;
  hasTokenAndEmail: boolean = false;

  constructor(
    private accountService: AccountService,
    private modalService: ModalService,
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    super();
  }

  ngOnInit(): void {
    this.accountService.user$.pipe(take(1)).subscribe({
      next: (user: User | null) => {
        if (user) {
          this.router.navigateByUrl('/');
        } else {
          this.activatedRoute.queryParamMap.subscribe({
            next: (params: any) => {
              this.token = params.get('token');
              this.email = params.get('email');

              if (!(this.token && this.email)) {
                this.modalService.showNotification(
                  false,
                  'Error',
                  'Invalid token or email'
                );
                this.router.navigateByUrl('/account/login');
                return;
              }

              this.initializeForm(this.email);
            },
          });
        }
      },
    });
  }

  initializeForm(userName: string): void {
    this.hasTokenAndEmail = this.token && this.email ? true : false;
    this.resetPasswordForm = this.formBuilder.group({
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

    if (!(this.resetPasswordForm.valid && this.token && this.email)) {
      return;
    }

    const resetPassword = <ResetPassword>{
      token: this.token,
      email: this.email,
      newPassword: this.resetPasswordForm.get('newPassword')?.value,
    };

    this.accountService.resetPassword(resetPassword).subscribe({
      next: (response: any) => {
        this.modalService.showNotification(
          true,
          response.value.title,
          response.value.message
        );
        this.router.navigateByUrl('/account/login');
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
}
