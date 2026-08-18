import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AccountService,
  FormBaseComponent,
  TranslationService,
  User,
  WebApiResponse,
} from '@friday/core';
import { Observable, of, take, tap } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: false,
})
export class LoginComponent
  extends FormBaseComponent
  implements OnInit, AfterViewInit
{
  returnUrl: string | null = null;
  // toggle show/hide password
  passwordVisible = false;

  @ViewChild('waveSvg')
  waveSvg?: ElementRef<SVGSVGElement>;

  constructor(
    private accountService: AccountService,
    private formBuilder: FormBuilder,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translationService: TranslationService,
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

  ngAfterViewInit(): void {
    // Chromium sometimes leaves the SMIL <animate> on the wave path parked on its first
    // keyframe forever - the SVG timeline clock runs (getCurrentTime() ticks normally), but the
    // animated attribute never advances - unless the timeline is explicitly restarted once the
    // view has settled. The restart has to happen after the browser's own initial SMIL autostart
    // pass, not synchronously in this hook, or it has no effect. Harmless no-op on browsers
    // where the animation already autostarts correctly.
    setTimeout(() => this.waveSvg?.nativeElement.setCurrentTime(0), 50);
  }

  initializeForm(): void {
    this.form = this.formBuilder.group({
      userName: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  login(): Observable<WebApiResponse<User> | null> {
    this.submitted = true;
    this.errorMessages = [];

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return of(null);
    }

    return this.accountService.login(this.form.value).pipe(
      tap({
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
          } else if (typeof response.error === 'string') {
            this.errorMessages.push(response.error);
          } else {
            this.errorMessages = [
              this.translationService.instant('ACCOUNT.SERVER_ERROR'),
            ];
          }
        },
      }),
    );
  }

  resendEmailConfirmation(): void {
    this.router.navigateByUrl('/account/send-email/resend-email-confirmation');
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
}
