import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Order, OrderStatus } from '@friday/core';

@Component({
  selector: 'app-order-form',
  standalone: false,
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.scss',
})
export class OrderFormComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('firstInput') firstInput!: ElementRef;

  @Input()
  isEdit = false;

  @Input()
  data?: Order | null;

  @Input()
  compact = false;

  @Input()
  errors: string[] | undefined;

  @Output()
  save = new EventEmitter<Order>();

  @Output()
  cancel = new EventEmitter<void>();

  form!: FormGroup;

  orderStatusOptions = [
    { value: OrderStatus.Open, label: 'Em Aberto' },
    { value: OrderStatus.Closed, label: 'Fechado' },
    { value: OrderStatus.WaitingPayment, label: 'Aguardando Pagamento' },
  ];

  constructor(private formBuilder: FormBuilder) {}

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.firstInput?.nativeElement) {
        this.firstInput.nativeElement.focus();
      }
    }, 0);
  }

  ngOnInit(): void {
    this.initForm();
    this.patchFormWithData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['data'] && !changes['data'].firstChange) ||
      (changes['isEdit'] && !changes['isEdit'].firstChange)
    ) {
      this.initForm();
      this.patchFormWithData();
    }
  }

  private patchFormWithData(): void {
    if (this.data && this.form) {
      this.form.patchValue({ ...this.data });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue());
  }

  doCancel(): void {
    this.cancel.emit();
  }

  private initForm(): void {
    this.form = this.formBuilder.group({
      orderNumber: ['', Validators.required],
      status: [OrderStatus.Open, Validators.required],
      description: [''],
      discount: [0],
      totalPrice: [0, [Validators.required, Validators.min(0)]],
      clientId: [null],
      clientName: [''],
    });
    if (this.isEdit) {
      this.form.addControl('id', this.formBuilder.control(''));
    }
  }
}
