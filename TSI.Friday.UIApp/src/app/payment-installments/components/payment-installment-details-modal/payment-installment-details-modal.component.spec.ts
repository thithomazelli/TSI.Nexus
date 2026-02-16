import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentInstallmentDetailsModalComponent } from './payment-installment-details-modal.component';

describe('PaymentInstallmentDetailsModalComponent', () => {
  let component: PaymentInstallmentDetailsModalComponent;
  let fixture: ComponentFixture<PaymentInstallmentDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentInstallmentDetailsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentInstallmentDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
