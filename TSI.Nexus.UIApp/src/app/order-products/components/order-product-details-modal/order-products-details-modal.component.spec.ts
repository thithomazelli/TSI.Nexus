import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderProductsDetailsModalComponent } from './order-products-details-modal.component';

describe('OrderProductsDetailsModalComponent', () => {
  let component: OrderProductsDetailsModalComponent;
  let fixture: ComponentFixture<OrderProductsDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [OrderProductsDetailsModalComponent],
}).compileComponents();

    fixture = TestBed.createComponent(OrderProductsDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
