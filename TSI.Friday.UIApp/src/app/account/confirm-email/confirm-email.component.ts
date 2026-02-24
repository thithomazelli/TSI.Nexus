import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService, ConfirmEmail, ModalService, User } from '@friday/core';
import { take } from 'rxjs';

@Component({
  selector: 'app-confirm-email',
  standalone: false,
  templateUrl: './confirm-email.component.html',
  styleUrl: './confirm-email.component.scss',
})
export class ConfirmEmailComponent implements OnInit {
  success: boolean = true;

  constructor(
    private accountService: AccountService,
    private modalService: ModalService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.accountService.user$.pipe(take(1)).subscribe({
      next: (user: User | null) => {
        if (user) {
          this.router.navigate(['/']);
        } else {
          this.activatedRoute.queryParamMap.subscribe({
            next: (params: any) => {
              const confirmEmail = <ConfirmEmail>{
                token: params.get('token'),
                email: params.get('email'),
              };

              this.accountService.confirmEmail(confirmEmail).subscribe({
                next: (response: any) => {
                  this.modalService.showSweetNotification(
                    response.value.title,
                    response.value.message,
                    'success',
                  );
                },
                error: (response: any) => {
                  this.success = false;

                  this.modalService.showSweetNotification(
                    'Failed',
                    response.error,
                    'error',
                  );
                },
              });
            },
          });
        }
      },
    });
  }

  resendEmailConfirmation(): void {
    this.router.navigateByUrl('/account/send-email/resend-email-confirmation');
  }
}
