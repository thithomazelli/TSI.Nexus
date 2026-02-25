import { Component, Input } from '@angular/core';
import {
  ApiService,
  ApiType,
  BusinessPartner,
  BusinessPartnerType,
  ModalService,
  WebApiResponse,
} from '@friday/core';
import {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community';
import { BusinessPartnerDetailsModalComponent } from './components/business-partner-details-modal/business-partner-details-modal.component';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-business-partners',
  templateUrl: './business-partners.component.html',
  styleUrl: './business-partners.component.scss',
  standalone: false,
})
export class BusinessPartnersComponent {
  private _baseEndPoint = ApiType.BusinessPartners;
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
    },
    {
      headerName: 'CPF / CNPJ',
      sortable: true,
      filter: true,
      flex: 1,
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
    },
    {
      field: 'mobile',
      headerName: 'Celular',
      sortable: true,
      filter: true,
      maxWidth: 120,
    },
    {
      headerName: 'Ações',
      sortable: false,
      filter: false,
      maxWidth: 400,
      resizable: true,
      width: 280,
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

  constructor(
    private apiService: ApiService,
    private modalService: ModalService,
    private routerService: Router,
  ) {}

  ngOnInit(): void {
    this.initialize();
    this.getBusinessPartners();
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

  refreshBusinessPartners(): void {
    this.getBusinessPartners();
  }

  deleteBusinessPartner(businessPartner: BusinessPartner): void {
    this.apiService
      .delete<
        WebApiResponse<BusinessPartner>
      >(`${this._baseEndPoint}/remove`, businessPartner)
      .subscribe((response: WebApiResponse<BusinessPartner>) => {
        this.rowData = this.rowData.filter((p) => p.id !== businessPartner.id);
        this.modalService.showSweetNotification(
          '',
          response.message,
          'success',
        );
      });
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

    const ref = this.modalService.showTemplateModal(
      BusinessPartnerDetailsModalComponent,
      initialStateWithData,
    );
    if (ref.componentInstance && ref.componentInstance.saved) {
      ref.componentInstance.saved.subscribe(() => {
        this.refreshBusinessPartners();
        ref.close();
      });
    }
  }

  private getBusinessPartners(): void {
    const endpoint =
      this.baseEndPoint === 'clients' ? 'getAllClients' : 'getAllSuppliers';

    this.apiService
      .get<
        WebApiResponse<BusinessPartner[]>
      >(`${this._baseEndPoint}/${endpoint}`)
      .subscribe((response: WebApiResponse<BusinessPartner[]>) => {
        this.rowData = response.data ?? [];
      });
  }
}
