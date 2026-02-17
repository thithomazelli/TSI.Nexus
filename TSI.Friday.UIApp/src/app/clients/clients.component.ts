import { Component, Input } from '@angular/core';
import {
  ApiService,
  ApiType,
  Client,
  ModalService,
  WebApiResponse,
} from '@friday/core';
import {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community';
import { ClientDetailsModalComponent } from './components/client-details-modal/client-details-modal.component';

@Component({
  selector: 'app-clients',
  standalone: false,
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
})
export class ClientsComponent {
  private _baseEndPoint = ApiType.Clients;

  rowData: Client[] = [];
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
      field: 'type',
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
        const type = params.data?.type;
        let value =
          type === 'Física'
            ? params.data?.socialSecurityCard || ''
            : params.data?.nationalRegistry || '';
        const digits = value.replace(/\D/g, '');
        if (type === 'Física' && digits.length === 11) {
          return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (type !== 'Física' && digits.length === 14) {
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
  ) {}

  ngOnInit(): void {
    this.getClients();
  }

  refreshClients(): void {
    this.getClients();
  }

  deleteClient(client: Client): void {
    this.apiService
      .delete<WebApiResponse<Client>>(`${this._baseEndPoint}/remove`, client)
      .subscribe((response: WebApiResponse<Client>) => {
        this.rowData = this.rowData.filter((p) => p.id !== client.id);
        this.modalService.showSweetNotification(
          '',
          response.message,
          'success',
        );
      });
  }

  onOpenModal(initialState: any) {
    const ref = this.modalService.showTemplateModal(
      ClientDetailsModalComponent,
      initialState,
    );
    if (ref.componentInstance && ref.componentInstance.saved) {
      ref.componentInstance.saved.subscribe(() => {
        this.refreshClients();
        ref.close();
      });
    }
  }

  private getClients(): void {
    this.apiService
      .get<WebApiResponse<Client[]>>(`${this._baseEndPoint}/getAll`)
      .subscribe((response: WebApiResponse<Client[]>) => {
        this.rowData = response.data ?? [];
      });
  }
}
