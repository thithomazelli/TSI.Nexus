import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AccountService,
  FormBaseComponent,
  ModalService,
  User,
} from '@friday/core';
import { take } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: false,
})
export class LoginComponent extends FormBaseComponent implements OnInit {
  loginForm: FormGroup = new FormGroup({});
  returnUrl: string | null = null;

  constructor(
    private accountService: AccountService,
    private modalService: ModalService,
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    super();
    this.accountService.user$.pipe(take(1)).subscribe({
      next: (user: User | null) => {
        if (user) {
          this.router.navigateByUrl('/');
        } else {
          this.activatedRoute.queryParamMap.subscribe({
            next: (params: any) => {
              if (params) {
                this.returnUrl = params.get('returnUrl');
              }
            },
          });
        }
      },
    });
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  login(): void {
    this.submitted = true;
    this.errorMessages = [];

    if (!this.loginForm.valid) {
      return;
    }

    this.accountService.login(this.loginForm.value).subscribe({
      next: (response: any) => {
        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.router.navigateByUrl('');
        }
      },
      error: (response) => {
        if (response.error.errors) {
          this.errorMessages = response.error.errors;
        } else {
          this.errorMessages.push(response.error);
        }
      },
    });
  }

  resendEmailConfirmation(): void {
    this.router.navigateByUrl('/account/send-email/resend-email-confirmation');
  }
}
