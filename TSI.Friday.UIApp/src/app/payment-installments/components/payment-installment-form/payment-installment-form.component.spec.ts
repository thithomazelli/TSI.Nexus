import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentInstallmentFormComponent } from './payment-installment-form.component';

describe('PaymentInstallmentFormComponent', () => {
  let component: PaymentInstallmentFormComponent;
  let fixture: ComponentFixture<PaymentInstallmentFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentInstallmentFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentInstallmentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
