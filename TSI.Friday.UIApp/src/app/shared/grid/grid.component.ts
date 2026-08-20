import { TemplateRef } from '@angular/core';
import {
  AG_GRID_LOCALE_BR,
  AG_GRID_LOCALE_EN,
  AG_GRID_LOCALE_ES,
} from '@ag-grid-community/locale';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { cardCollapseAnimation } from '../../core/animations/card-collapse.animation';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalService, TranslationService } from '@friday/core';
import {
  CellClickedEvent,
  ColDef,
  GridApi,
  GridReadyEvent,
  RowDoubleClickedEvent,
} from 'ag-grid-community';
import { map } from 'rxjs';
import { NgIf, NgClass, NgTemplateOutlet, LowerCasePipe } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { TranslatePipe } from '../../core/pipes/translate.pipe';

const AG_GRID_LOCALES: Record<string, Record<string, string>> = {
  'pt-BR': AG_GRID_LOCALE_BR,
  en: AG_GRID_LOCALE_EN,
  es: AG_GRID_LOCALE_ES,
};

@Component({
    selector: 'app-grid',
    templateUrl: './grid.component.html',
    styleUrl: './grid.component.scss',
    animations: [cardCollapseAnimation],
    imports: [
        NgIf,
        NgClass,
        NgTemplateOutlet,
        AgGridAngular,
        TranslatePipe,
        LowerCasePipe,
    ],
})
export class GridComponent<T> implements OnInit {
  @Input()
  filtersTemplate?: TemplateRef<any>;

  @Input()
  extraActionsTemplate?: TemplateRef<any>;

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
  canAdd: boolean = true;

  @Input()
  showFilters: boolean = false;

  @Input()
  refresh!: () => void;

  @Input()
  delete!: (data: T) => void;

  @Input()
  update!: (data: T) => void;

  // Some entities (e.g. Orders) are too large to edit in a modal - only a full add flow and the
  // view/delete actions make sense there, so the double-click shortcut has to follow suit instead
  // of always opening the (removed) edit modal.
  @Input()
  rowDoubleClickAction: 'edit' | 'view' | 'none' = 'edit';

  @Output() openModal = new EventEmitter<any>();

  gridStyle: string = '';
  gridApi!: GridApi;
  quickFilter = '';
  localeText: Record<string, string> = AG_GRID_LOCALE_BR;
  noRowsOverlayTemplate = '';

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    suppressMovable: true,
  };

  private _parentId: string | null = null;
  private readonly _actionsMap: {
    [key: string]: (data: any) => void;
  } = {
    edit: this.editAction.bind(this),
    view: this.viewAction.bind(this),
    delete: this.deleteAction.bind(this),
    update: this.updateAction.bind(this),
  };
  constructor(
    private modalService: ModalService,
    private routerService: Router,
    private activatedRoute: ActivatedRoute,
    private translationService: TranslationService,
  ) {
    this.localeText =
      AG_GRID_LOCALES[this.translationService.current] ?? AG_GRID_LOCALE_BR;
    this.noRowsOverlayTemplate = `<span class="text-muted p-3">${this.translationService.instant(
      'GRID.NO_ROWS',
    )}</span>`;
  }

  ngOnInit(): void {
    this.gridStyle = this.compactView ? 'compact-view' : 'regular-view';

    this.activatedRoute.paramMap
      .pipe(map((params) => params.get('id')))
      .subscribe((id) => {
        this._parentId = id;
      });

    this.translationService.language$.subscribe((language) => {
      // ag-grid's own localeText isn't a live-updatable grid option - it's read once when the
      // grid initializes. The initial locale (set in the constructor from the current language)
      // covers the common case; a full reload picks up a language switch made mid-session.
      this.noRowsOverlayTemplate = `<span class="text-muted p-3">${this.translationService.instant(
        'GRID.NO_ROWS',
      )}</span>`;
      this.gridApi?.setGridOption?.(
        'overlayNoRowsTemplate',
        this.noRowsOverlayTemplate,
      );
    });
  }

  onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
  }

  onFirstDataRendered(params: any): void {
    if (
      !params ||
      !params.columnApi ||
      typeof params.columnApi.getAllColumns !== 'function'
    ) {
      return;
    }
    const allColumnIds: string[] = [];
    params.columnApi.getAllColumns()?.forEach((column: any) => {
      if (column.getColId) {
        allColumnIds.push(column.getColId());
      } else if (typeof column.colId === 'string') {
        allColumnIds.push(column.colId);
      }
    });
    if (
      allColumnIds.length &&
      typeof params.columnApi.autoSizeColumns === 'function'
    ) {
      params.columnApi.autoSizeColumns(allColumnIds, false);
    }
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
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

  onRowDoubleClicked(event: RowDoubleClickedEvent): void {
    if (!event.data || this.rowDoubleClickAction === 'none') {
      return;
    }
    if (this.rowDoubleClickAction === 'view') {
      this.viewAction(event.data);
    } else {
      this.editAction(event.data);
    }
  }

  openAddModal(): void {
    const initialState = {
      isEdit: false,
      id: null,
      parentId: this._parentId,
    };
    this.openModal.emit(initialState);
  }

  editAction(data: any): void {
    const initialState = {
      isEdit: true,
      data: data,
      id: data.id,
      parentId: this._parentId,
    };
    this.openModal.emit(initialState);
  }

  private viewAction(data: any): void {
    this.routerService.navigateByUrl(`/${this.baseEndPoint}/${data.id}`);
  }

  private deleteAction(data: any): void {
    this.modalService
      .showSweetConfirmation(
        '',
        this.translationService.instant('GRID.CONFIRM_DELETE'),
        'question',
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

  private confirmDelete(data: T): void {
    if (!data) {
      return;
    }

    this.delete(data);
  }
}
