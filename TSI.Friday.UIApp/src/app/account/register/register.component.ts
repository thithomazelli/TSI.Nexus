import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AccountService,
  FormBaseComponent,
  ModalService,
  User,
  WebApiResponse,
} from '@friday/core';
import { take } from 'rxjs';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  standalone: false,
})
export class RegisterComponent extends FormBaseComponent implements OnInit {
  constructor(
    private accountService: AccountService,
    private modalService: ModalService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    super();
    this.accountService.user$.pipe(take(1)).subscribe({
      next: (user: User | null) => {
        if (user) {
          this.router.navigateByUrl('/');
        }
      },
    });
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.form = this.formBuilder.group({
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
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(15),
        ],
      ],
    });
  }

  register(): void {
    this.submitted = true;
    this.errorMessages = [];

    if (!this.form.valid) {
      return;
    }

    this.accountService.register(this.form.value).subscribe({
      next: (response: WebApiResponse<User>) => {
        this.modalService.showSweetNotification(
          'Usuário registrado',
          response.message,
          'success'
        );

        this.router.navigateByUrl('account/login');
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
}
