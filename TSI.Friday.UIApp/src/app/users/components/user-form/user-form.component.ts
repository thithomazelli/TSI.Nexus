import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
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
  implements OnInit, OnChanges
{
  @Input()
  isEdit = false;

  @Input()
  data?: User | null;

  // controla estilo compacto quando usado em page
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

  constructor(
    private formBuilder: FormBuilder,
    private accountService: AccountService,
    private modalService: ModalService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // quando data chegar depois do init, apenas patch no form
    if (changes['data'] && changes['data'].currentValue && this.form) {
      this.form.patchValue(changes['data'].currentValue);
    }

    // se o modo de edição mudar depois, re-inicializa o form com o novo modo
    if (changes['isEdit'] && !changes['isEdit'].firstChange) {
      this.initForm();
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
    this.accountService
      .resendEmailConfirmation(this.form.get('email')?.value)
      .subscribe({
        next: (response: any) => {
          this.modalService.hideModal();
          this.modalService.showNotification(
            true,
            response.value.title,
            response.value.message,
          );
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
