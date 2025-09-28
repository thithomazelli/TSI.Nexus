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
  selector: 'app-send-email',
  standalone: false,
  templateUrl: './send-email.component.html',
  styleUrl: './send-email.component.scss',
})
export class SendEmailComponent extends FormBaseComponent implements OnInit {
  emailForm: FormGroup = new FormGroup({});
  mode: string | null = '';

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
          this.mode = this.activatedRoute.snapshot.paramMap.get('mode') || '';
          this.initializeForm();
        }
      },
    });
  }

  initializeForm(): void {
    this.emailForm = this.formBuilder.group({
      email: [
        '',
        [
          Validators.required,
          Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,4}$'),
        ],
      ],
    });
  }

  sendEmail(): void {
    this.submitted = true;
    this.errorMessages = [];

    if (!(this.emailForm.valid && this.mode)) {
      return;
    }

    if (this.mode.includes('resend-email-confirmation')) {
      this.accountService
        .resendEmailConfirmation(this.emailForm.get('email')?.value)
        .subscribe({
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
    } else if (this.mode.includes('forgot-username-or-password')) {
      this.accountService
        .forgotUsernameOrPassword(this.emailForm.get('email')?.value)
        .subscribe({
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

  cancel(): void {
    this.router.navigateByUrl('/account/login');
  }
}
