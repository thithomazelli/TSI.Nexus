import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentInstallmentsComponent } from './payment-installments.component';

describe('PaymentInstallmentsComponent', () => {
  let component: PaymentInstallmentsComponent;
  let fixture: ComponentFixture<PaymentInstallmentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentInstallmentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentInstallmentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
