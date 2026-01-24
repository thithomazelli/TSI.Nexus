import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderProductsFormComponent } from './order-products-form.component';

describe('OrderProductsFormComponent', () => {
  let component: OrderProductsFormComponent;
  let fixture: ComponentFixture<OrderProductsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrderProductsFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderProductsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
