import { Component } from '@angular/core';
import {
  BusinessPartner,
  BusinessPartnerService,
  BusinessPartnerType,
  ModalService,
  NotificationService,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';
import {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community';
import { BusinessPartnerDetailsModalComponent } from './components/business-partner-details-modal/business-partner-details-modal.component';
import { Router } from '@angular/router';
import { startWith, Subject, Subscription, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-business-partners',
  templateUrl: './business-partners.component.html',
  styleUrl: './business-partners.component.scss',
  standalone: false,
})
export class BusinessPartnersComponent {
  title: string = '';
  baseEndPoint: string = '';
  rowData: BusinessPartner[] = [];
  columnDefs: ColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      sortable: true,
      filter: true,
      hide: true,
    },
    {
      field: 'name',
      headerName: 'Nome',
      sortable: true,
      filter: true,
      minWidth: 250,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        return `<a data-action="view" class="ag-link">${value}</a>`;
      },
    },
    {
      field: 'documentType',
      headerName: 'Tipo',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 85,
    },
    {
      headerName: 'CPF / CNPJ',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 160,
      cellRenderer: (params: ValueFormatterParams) => {
        const documentType = params.data?.documentType;
        let value =
          documentType === 'Física'
            ? params.data?.socialSecurityCard || ''
            : params.data?.nationalRegistry || '';
        const digits = value.replace(/\D/g, '');
        if (documentType === 'Física' && digits.length === 11) {
          return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (documentType !== 'Física' && digits.length === 14) {
          return digits.replace(
            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
            '$1.$2.$3/$4-$5',
          );
        }
        return value;
      },
    },
    {
      field: 'email',
      headerName: 'Email',
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 250,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        return `<a data-action="view" class="ag-link">${value}</a>`;
      },
    },
    {
      field: 'birthday',
      headerName: 'Birthday',
      sortable: true,
      filter: true,
      flex: 2,
      hide: true,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      sortable: true,
      filter: true,
      flex: 2,
      hide: true,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        const digits = value.replace(/\D/g, '');
        if (digits.length === 10) {
          return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return value;
      },
    },
    {
      field: 'mobile',
      headerName: 'Celular',
      sortable: true,
      filter: true,
      minWidth: 60,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        const digits = value.replace(/\D/g, '');
        if (digits.length === 11) {
          return digits.replace(
            /(\d{2})(\d{1})(\d{4})(\d{4})/,
            '($1) $2 $3-$4',
          );
        }
        return value;
      },
    },
    {
      headerName: 'Ações',
      minWidth: 150,
      sortable: false,
      filter: false,
      resizable: true,
      cellRenderer: (params: ICellRendererParams) => {
        return `
          <button class="btn btn-primary btn-sm" data-action="view">
            <i class="fas fa-eye" data-action="view"></i>
          </button>
          <button class="btn btn-info btn-sm" data-action="edit">
            <i class="fas fa-edit" data-action="edit"></i>
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete">
            <i class="fas fa-trash" data-action="delete"></i>  
          </button>
        `;
      },
    },
  ];

  private _businessPartnerChangedSub?: Subscription;
  private _destroy$ = new Subject<void>();

  constructor(
    private businessPartnerService: BusinessPartnerService,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private routerService: Router,
  ) {}

  ngOnInit(): void {
    this.initialize();
    this._businessPartnerChangedSub =
      this.businessPartnerService.businessPartnerChanged$
        .pipe(startWith(null), takeUntil(this._destroy$))
        .subscribe(() => {
          this.getBusinessPartners();
        });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
    if (this._businessPartnerChangedSub) {
      this._businessPartnerChangedSub.unsubscribe();
    }
  }

  onOpenModal(initialState: any) {
    const initialStateWithData = {
      ...initialState,
      data: {
        ...initialState.data,
        type:
          this.baseEndPoint === 'clients'
            ? BusinessPartnerType.Client
            : BusinessPartnerType.Supplier,
      },
    };

    this.modalService.showTemplateModal(
      BusinessPartnerDetailsModalComponent,
      initialStateWithData,
    );
  }

  deleteBusinessPartner(businessPartner: BusinessPartner): void {
    this.businessPartnerService
      .delete(businessPartner)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<BusinessPartner>) => {
        this.rowData = this.rowData.filter((p) => p.id !== businessPartner.id);
        this.modalService.hideModal();
        this.modalService.showSweetNotification(
          'Item excluído',
          response.message,
          response.status,
        );
      });
  }

  refreshBusinessPartners(): void {
    const type =
      this.baseEndPoint === 'clients'
        ? BusinessPartnerType.Client
        : BusinessPartnerType.Supplier;

    this.businessPartnerService
      .refresh(type)
      .pipe(
        tap({
          next: () =>
            this.notificationService.showMessage(
              ResponseStatus.Success,
              type === BusinessPartnerType.Client
                ? 'Clientes atualizados com sucesso'
                : 'Fornecedores atualizados com sucesso',
            ),
          error: () =>
            this.notificationService.showMessage(
              ResponseStatus.Error,
              type === BusinessPartnerType.Client
                ? 'Erro ao atualizar Clientes'
                : 'Erro ao atualizar Fornecedores',
            ),
        }),
        takeUntil(this._destroy$),
      )
      .subscribe((response: WebApiResponse<BusinessPartner[]>) => {
        this.rowData = response.data ?? [];
      });
  }

  private initialize(): void {
    const url = this.routerService.url;
    if (url.includes('clients')) {
      this.baseEndPoint = 'clients';
      this.title = 'Clientes';
    } else if (url.includes('suppliers')) {
      this.baseEndPoint = 'suppliers';
      this.title = 'Fornecedores';
    } else {
      this.baseEndPoint = '';
      this.title = '';
    }
  }

  private getBusinessPartners(): void {
    this.baseEndPoint === 'clients' ? this.getClients() : this.getSuppliers();
  }

  private getClients(): void {
    this.businessPartnerService
      .getClients()
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<BusinessPartner[]>) => {
        this.rowData = response.data ?? [];
      });
  }

  private getSuppliers(): void {
    this.businessPartnerService
      .getSuppliers()
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<BusinessPartner[]>) => {
        this.rowData = response.data ?? [];
      });
  }
}
