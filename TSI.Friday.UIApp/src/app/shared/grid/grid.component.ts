import { AG_GRID_LOCALE_BR } from '@ag-grid-community/locale';
import { Component, Input, OnInit } from '@angular/core';
import { GridService, ModalService, Product } from '@friday/core';
import {
  CellClickedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community';
import { ModalOptions } from 'ngx-bootstrap/modal';

@Component({
  selector: 'app-grid',
  standalone: false,
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.scss',
})
export class GridComponent<T> implements OnInit {
  @Input()
  className: string = '';

  @Input()
  rowData: T[] = [];

  @Input()
  columnDefs: ColDef[] = [];

  @Input()
  baseEndPoint: string = '';

  @Input()
  modalDetails!: any;

  @Input()
  refresh!: () => void;

  @Input()
  delete!: (data: T) => void;

  gridApi!: GridApi;
  quickFilter = '';
  localeText = AG_GRID_LOCALE_BR;

  noRowsOverlayTemplate =
    '<span class="text-muted p-3">Nenhum item encontrado</span>';

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  constructor(
    private gridService: GridService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    this.gridService.gridDataObservable().subscribe((response) => {
      if (!response) {
        return;
      }

      if (response.id === null) {
        this.addData(response.data);
      } else {
        this.editData(response.data);
      }
    });
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.updateNoRowsOverlay();
  }

  onFilterTextBoxChanged(event: Event): void {
    this.quickFilter = (event.target as HTMLInputElement).value || '';
  }

  onCellClicked(event: CellClickedEvent): void {
    const target = event.event?.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const action = target.getAttribute('data-action');
    if (!action) {
      return;
    }

    const data = event.data;

    if (action === 'edit') {
      this.openEditModal(data);
    } else if (action === 'delete') {
      const initialState: ModalOptions = {
        initialState: {
          selectedItem: data,
          confirmDelete: this.confirmDelete.bind(this, data),
        },
      };
      this.modalService.showConfirmation(initialState);
    }
  }

  openAddModal(): void {
    const initialState: ModalOptions = {
      initialState: {
        isEditMode: false,
        currentId: null,
      },
    };
    this.modalService.showTemplateModal(this.modalDetails, initialState);
  }

  openEditModal(product: Product): void {
    const initialState: ModalOptions = {
      initialState: {
        isEditMode: true,
        currentId: product.id,
        data: product,
      },
    };
    this.modalService.showTemplateModal(this.modalDetails, initialState);
  }

  private addData(data: T): void {
    this.rowData = [...this.rowData, data];
  }

  private editData(data: any): void {
    this.rowData = this.rowData.map((item: any) =>
      item.id === data.id ? data : item
    );
  }

  private confirmDelete(data: T): void {
    if (!data) {
      return;
    }

    this.delete(data);
    this.modalService.hideModal();
  }

  private updateNoRowsOverlay(): void {
    if (!this.gridApi) {
      return;
    }

    if (!this.rowData || this.rowData.length === 0) {
      this.gridApi.showNoRowsOverlay();
    } else {
      this.gridApi.hideOverlay();
    }
  }
}
