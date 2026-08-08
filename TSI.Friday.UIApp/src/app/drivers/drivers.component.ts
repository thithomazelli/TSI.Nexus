import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import {
  Driver,
  DriverService,
  NotificationService,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';
import { Subscription, tap, Subject, takeUntil } from 'rxjs';
import { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';

@Component({
  selector: 'app-drivers',
  templateUrl: './drivers.component.html',
  styleUrl: './drivers.component.scss',
  standalone: false,
})
export class DriversComponent implements OnInit, OnDestroy {
  private _driverChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  baseEndPoint = 'drivers';

  employmentTypeMap: { [key: string]: string } = {
    CLT: 'CLT',
    Outsourced: 'Terceirizado',
    Autonomous: 'Autônomo',
  };

  statusMap: { [key: string]: { label: string; color: string } } = {
    Active: { label: 'Ativo', color: 'success' },
    Inactive: { label: 'Inativo', color: 'secondary' },
    OnLeave: { label: 'Afastado', color: 'warning' },
  };

  rowData: Driver[] = [];
  columnDefs: ColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      hide: true,
    },
    {
      field: 'name',
      headerName: 'Nome',
      flex: 1,
      minWidth: 200,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        return `<a data-action="view" class="ag-link">${value}</a>`;
      },
    },
    {
      field: 'socialSecurityCard',
      headerName: 'CPF',
      width: 140,
    },
    {
      field: 'licenseNumber',
      headerName: 'CNH',
      width: 140,
    },
    {
      field: 'licenseCategory',
      headerName: 'Categoria',
      maxWidth: 110,
    },
    {
      field: 'licenseExpiryDate',
      headerName: 'Validade CNH',
      maxWidth: 140,
      valueFormatter: (params: ValueFormatterParams) => {
        if (!params.value) {
          return '';
        }
        return new Date(params.value).toLocaleDateString('pt-BR');
      },
    },
    {
      field: 'employmentType',
      headerName: 'Vínculo',
      maxWidth: 130,
      valueFormatter: (params: ValueFormatterParams) =>
        this.employmentTypeMap[params.value] ?? params.value ?? '',
    },
    {
      field: 'status',
      headerName: 'Status',
      maxWidth: 130,
      cellRenderer: (params: ICellRendererParams) => {
        const info = this.statusMap[params.value] ?? {
          label: params.value,
          color: 'secondary',
        };
        return `<span class="badge bg-${info.color}">${info.label}</span>`;
      },
    },
    {
      headerName: 'Ações',
      minWidth: 150,
      sortable: false,
      filter: false,
      cellRenderer: () => {
        return `
          <button class="btn btn-primary btn-sm" data-action="view">
            <i class="fas fa-eye" data-action="view"></i>
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete">
            <i class="fas fa-trash" data-action="delete"></i>
          </button>
        `;
      },
    },
  ];

  constructor(
    private notificationService: NotificationService,
    private driverService: DriverService,
    private routerService: Router,
  ) {}

  ngOnInit(): void {
    this.getDrivers();
    this._driverChangedSub = this.driverService.driverChanged$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => this.getDrivers());
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._driverChangedSub) {
      this._driverChangedSub.unsubscribe();
    }
  }

  openAddPage(): void {
    this.routerService.navigateByUrl('/drivers/new');
  }

  deleteDriver(driver: Driver): void {
    this.driverService
      .delete(driver)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Driver>) => {
        if (response.status === ResponseStatus.Success) {
          this.rowData = this.rowData.filter((d) => d.id !== driver.id);
        }
        this.notificationService.showMessage(response.status, response.message);
      });
  }

  refreshDrivers(): void {
    this.driverService
      .refresh()
      .pipe(
        tap({
          next: () =>
            this.notificationService.showMessage(
              ResponseStatus.Success,
              'Motoristas atualizados com sucesso',
            ),
          error: () =>
            this.notificationService.showMessage(
              ResponseStatus.Error,
              'Erro ao atualizar motoristas',
            ),
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((response: WebApiResponse<Driver[]>) => {
        this.rowData = response.data ?? [];
      });
  }

  private getDrivers(): void {
    this.driverService
      .getAll()
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Driver[]>) => {
        this.rowData = response.data ?? [];
      });
  }
}
