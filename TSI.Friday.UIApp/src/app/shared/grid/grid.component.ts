import { AG_GRID_LOCALE_BR } from '@ag-grid-community/locale';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiType, GridService, ModalService, Product } from '@friday/core';
import {
  CellClickedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community';

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrl: './grid.component.scss',
  standalone: false,
})
export class GridComponent<T> implements OnInit {
  @Input()
  baseEndPoint: string = '';

  @Input()
  className: string = '';

  @Input()
  compactView: boolean = false;

  @Input()
  rowData: T[] = [];

  @Input()
  columnDefs: ColDef[] = [];

  @Input()
  modalDetails!: any;

  @Input()
  refresh!: () => void;

  @Input()
  delete!: (data: T) => void;

  @Input()
  update!: (data: T) => void;

  gridStyle: string = '';
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

  private _parentId: number | null = null;
  private readonly _actionsMap: {
    [key: string]: (data: any) => void;
  } = {
    edit: this.editAction.bind(this),
    view: this.viewAction.bind(this),
    delete: this.deleteAction.bind(this),
    update: this.updateAction.bind(this),
  };
  constructor(
    private gridService: GridService,
    private modalService: ModalService,
    private routerService: Router,
    private activatedRoute: ActivatedRoute
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

    this.gridStyle = this.compactView ? 'compact-view' : 'regular-view';

    this._parentId =
      Number(this.activatedRoute.snapshot.paramMap.get('id')) ?? null;
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
    if (!action || !(action in this._actionsMap)) {
      return;
    }

    this._actionsMap[action](event.data);
  }

  openAddModal(): void {
    const initialState = {
      isEdit: false,
      id: null,
      parentId: this._parentId,
    };
    this.modalService.showTemplateModal(this.modalDetails, initialState);
  }

  private editAction(data: any): void {
    const initialState = {
      isEdit: true,
      data: data,
      id: data.id,
      parentId: this._parentId,
    };
    this.modalService.showTemplateModal(this.modalDetails, initialState);
  }

  private viewAction(data: any): void {
    if (this.baseEndPoint === ApiType.Clients) {
      this.baseEndPoint = data.type === 'Física' ? 'individuals' : 'companies';
    }

    this.routerService.navigateByUrl(`/${this.baseEndPoint}/${data.id}`);
  }

  private deleteAction(data: any): void {
    this.modalService
      .showSweetConfirmation(
        '',
        'Deseja realmente excluir este item?',
        'question'
      )
      .then((result: any) => {
        if (result.isConfirmed) {
          this.confirmDelete(data);
        }
      });
  }

  private updateAction(data: any): void {
    this.update(data);
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
