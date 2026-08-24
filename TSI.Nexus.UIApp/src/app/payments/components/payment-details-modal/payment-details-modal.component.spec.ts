import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentDetailsModalComponent } from './payment-details-modal.component';

describe('PaymentDetailsModalComponent', () => {
  let component: PaymentDetailsModalComponent;
  let fixture: ComponentFixture<PaymentDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentDetailsModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
