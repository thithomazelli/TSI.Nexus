import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientsOrdersListComponent } from './clients-orders-list.component';

describe('ClientsOrdersListComponent', () => {
  let component: ClientsOrdersListComponent;
  let fixture: ComponentFixture<ClientsOrdersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClientsOrdersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientsOrdersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
