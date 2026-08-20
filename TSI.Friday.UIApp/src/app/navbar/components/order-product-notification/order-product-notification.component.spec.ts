import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderProductNotificationComponent } from './order-product-notification.component';

describe('OrderProductNotificationComponent', () => {
  let component: OrderProductNotificationComponent;
  let fixture: ComponentFixture<OrderProductNotificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [OrderProductNotificationComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(OrderProductNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
