import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressDetailsModalComponent } from './address-details-modal.component';

describe('AddressDetailsModalComponent', () => {
  let component: AddressDetailsModalComponent;
  let fixture: ComponentFixture<AddressDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AddressDetailsModalComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(AddressDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
