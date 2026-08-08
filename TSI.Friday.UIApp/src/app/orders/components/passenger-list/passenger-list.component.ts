import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  NotificationService,
  Passenger,
  PassengerService,
  ResponseStatus,
  WebApiResponse,
} from '@friday/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-passenger-list',
  templateUrl: './passenger-list.component.html',
  styleUrl: './passenger-list.component.scss',
  standalone: false,
})
export class PassengerListComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  orderId!: string;

  passengers: Passenger[] = [];
  showForm = false;
  showImport = false;
  importText = '';
  form!: ReturnType<FormBuilder['group']>;

  private _destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
    private passengerService: PassengerService,
  ) {
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      documentNumber: [''],
      seat: [''],
      phone: [''],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['orderId'] && !changes['orderId'].firstChange) {
      this.load();
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  toggleImport(): void {
    this.showImport = !this.showImport;
  }

  addPassenger(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const passenger = {
      id: '',
      name: raw.name,
      documentNumber: raw.documentNumber,
      seat: raw.seat,
      phone: raw.phone,
      orderId: this.orderId,
    } as Passenger;

    this.passengerService
      .add(passenger)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Passenger>) => {
        this.notificationService.showMessage(response.status, response.message);
        if (response.status === ResponseStatus.Success) {
          this.showForm = false;
          this.form.reset({ name: '', documentNumber: '', seat: '', phone: '' });
          this.load();
        }
      });
  }

  /**
   * Parses pasted spreadsheet rows (tab or comma separated: Nome, Documento, Assento, Telefone)
   * and imports the whole batch in a single request - this is the "lista de passageiros" import,
   * fed from a copy-paste out of Excel/Sheets rather than uploading a binary file.
   */
  importPassengers(): void {
    const lines = this.importText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return;
    }

    const passengers = lines.map((line) => {
      const columns = line.includes('\t') ? line.split('\t') : line.split(',');
      return {
        id: '',
        name: (columns[0] ?? '').trim(),
        documentNumber: (columns[1] ?? '').trim(),
        seat: (columns[2] ?? '').trim(),
        phone: (columns[3] ?? '').trim(),
        orderId: this.orderId,
      } as Passenger;
    });

    this.passengerService
      .addRange(passengers)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Passenger[]>) => {
        this.notificationService.showMessage(response.status, response.message);
        if (response.status === ResponseStatus.Success) {
          this.showImport = false;
          this.importText = '';
          this.load();
        }
      });
  }

  removePassenger(passenger: Passenger): void {
    this.passengerService
      .delete(passenger)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response: WebApiResponse<Passenger>) => {
        this.notificationService.showMessage(response.status, response.message);
        this.load();
      });
  }

  private load(): void {
    if (!this.orderId) {
      return;
    }
    this.passengerService
      .getByOrder(this.orderId)
      .pipe(takeUntil(this._destroy$))
      .subscribe((response) => {
        this.passengers = response.data ?? [];
      });
  }
}
