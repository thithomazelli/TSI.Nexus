import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

import {
  ApiType,
  Driver,
  DriverService,
  DriverStatus,
  EmploymentType,
  FormBaseComponent,
  ModalService,
  NotificationService,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';

import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { DriverDetailsModalComponent } from '../driver-details-modal/driver-details-modal.component';

@Component({
  selector: 'app-driver-form',
  templateUrl: './driver-form.component.html',
  styleUrl: './driver-form.component.scss',
  standalone: false,
})
export class DriverFormComponent
  extends FormBaseComponent
  implements OnInit, OnChanges
{
  @Input()
  isModal = false;

  @Input()
  isEdit = false;

  @Input()
  data?: Driver | null;

  @Input()
  compact = false;

  @Input()
  dialogRef?: MatDialogRef<DriverDetailsModalComponent>;

  employmentTypeOptions = [
    { label: 'CLT', value: EmploymentType.CLT },
    { label: 'Terceirizado', value: EmploymentType.Outsourced },
    { label: 'Autônomo', value: EmploymentType.Autonomous },
  ];

  statusOptions = [
    { label: 'Ativo', value: DriverStatus.Active },
    { label: 'Inativo', value: DriverStatus.Inactive },
    { label: 'Afastado', value: DriverStatus.OnLeave },
  ];

  private _baseEndPoint: ApiType = ApiType.Drivers;

  constructor(
    private formBuilder: FormBuilder,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private driverService: DriverService,
    private routerService: Router,
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
    this.patchFormWithData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && changes['data'].currentValue && this.form) {
      this.form.patchValue(changes['data'].currentValue);
    }
  }

  submit(): Observable<WebApiResponse<Driver> | null> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return of(null);
    }

    const rawValue = this.form.getRawValue();

    if (this.data) {
      Object.assign(this.data!, rawValue);
    }

    return this.save(rawValue as Driver).pipe(
      tap({
        next: (response: WebApiResponse<Driver>) => {
          if (this.isModal) {
            this.saveModal(response);
          } else {
            this.savePage(response);
          }
        },
        error: () =>
          this.notificationService.showMessage(
            ResponseStatus.Error,
            'Erro ao salvar',
          ),
      }),
    );
  }

  cancel(): void {
    if (this.isModal) {
      this.modalService.hideModal(this.dialogRef);
    } else {
      this.routerService.navigateByUrl(`/${this._baseEndPoint}`);
    }
  }

  remove(): void {
    if (!this.data) {
      return;
    }

    this.driverService
      .delete(this.data)
      .pipe(
        tap({
          next: (response: WebApiResponse<Driver>) => {
            if (this.isModal) {
              this.modalService.hideModal(this.dialogRef);
            }
            this.notificationService.showMessage(
              response.status,
              response.message,
            );
            if (response.status === ResponseStatus.Success && !this.isModal) {
              this.routerService.navigateByUrl(`/${this._baseEndPoint}`);
            }
          },
          error: () =>
            this.notificationService.showMessage(
              ResponseStatus.Error,
              'Erro ao remover',
            ),
        }),
      )
      .subscribe();
  }

  private initForm(): void {
    const commonControls = {
      name: ['', Validators.required],
      email: ['', Validators.email],
      phone: [''],
      mobile: [''],
      socialSecurityCard: ['', Validators.required],
      nationalIdCard: [''],
      birthday: [null as Date | null],
      licenseNumber: ['', Validators.required],
      licenseCategory: ['', Validators.required],
      licenseExpiryDate: [null as Date | null, Validators.required],
      employmentType: [EmploymentType.CLT, Validators.required],
      admissionDate: [null as Date | null],
      status: [DriverStatus.Active, Validators.required],
      commissionPercentage: [0, [Validators.min(0), Validators.max(100)]],
    };

    this.form = !this.isEdit
      ? this.formBuilder.group(commonControls)
      : this.formBuilder.group({ id: [''], ...commonControls });
  }

  private patchFormWithData(): void {
    if (this.data && this.form) {
      this.form.patchValue(this.data);
    }
  }

  private save(driver: Driver): Observable<WebApiResponse<Driver>> {
    return this.isEdit && this.data
      ? this.driverService.update(driver)
      : this.driverService.add(driver);
  }

  private savePage(response: WebApiResponse<Driver>): void {
    if (this.isEdit && this.data) {
      this.notificationService.showMessage(response.status, response.message);
      this.data = response.data;
    } else if (response.status === ResponseStatus.Success) {
      this.routerService.navigateByUrl(
        `/${this._baseEndPoint}/${response.data.id}`,
      );
    } else {
      this.notificationService.showMessage(response.status, response.message);
    }
  }

  private saveModal(response: WebApiResponse<Driver>): void {
    this.dialogRef?.close(response);

    if (response.status === ResponseStatus.Success) {
      this.modalService.showNotification(
        true,
        this.isEdit ? 'Motorista atualizado' : 'Motorista adicionado',
        response.message,
      );
      return;
    }

    this.modalService.showNotification(false, '', response.message);
  }
}
