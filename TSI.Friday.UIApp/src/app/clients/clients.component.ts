import { Component } from '@angular/core';
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
      // minWidth: 80,
      hide: true,
    },
    {
      field: 'name',
      headerName: 'Name',
      sortable: true,
      filter: true,
      // width: 90,
      resizable: false,
      // minWidth: 150,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        // href="#" prevents full page reload; onCellClicked handles navigation
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
            '$1.$2.$3/$4-$5'
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
      // minWidth: 150,
      cellRenderer: (params: ValueFormatterParams) => {
        const value = params.value ?? '';
        // href="#" prevents full page reload; onCellClicked handles navigation
        return `<a data-action="view" class="ag-link">${value}</a>`;
      },
    },
    {
      field: 'birthday',
      headerName: 'Birthday',
      sortable: true,
      filter: true,
      flex: 2,
      // minWidth: 1500,
      hide: true,
    },
    {
      field: 'phone',
      headerName: 'Phone',
      sortable: true,
      filter: true,
      flex: 2,
      // minWidth: 1500,
      hide: true,
    },
    {
      field: 'mobile',
      headerName: 'Mobile',
      sortable: true,
      filter: true,
      maxWidth: 120,
    },
    {
      headerName: '',
      sortable: false,
      filter: false,
      maxWidth: 400,
      resizable: true,
      width: 280,
      cellRenderer: (params: ICellRendererParams) => {
        return `
          <button class="btn btn-primary btn-sm" data-action="view">
            <i class="fas fa-folder"></i>
            View
          </button>
          <button class="btn btn-info btn-sm" data-action="edit">
            <i class="fas fa-edit"></i>
            Edit
          </button>
          <button class="btn btn-danger btn-sm" data-action="delete">
            <i class="fas fa-trash"></i>  
            Delete
          </button>
        `;
      },
    },
  ];

  modalDetails = ClientDetailsModalComponent;

  constructor(
    private apiService: ApiService,
    private modalService: ModalService
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
          'success'
        );
      });
  }

  private getClients(): void {
    this.apiService
      .get<WebApiResponse<Client[]>>(`${this._baseEndPoint}/getAll`)
      .subscribe((response: WebApiResponse<Client[]>) => {
        this.rowData = response.data ?? [];
      });
  }
}
