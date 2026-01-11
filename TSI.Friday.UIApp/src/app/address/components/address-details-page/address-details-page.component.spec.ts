import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddressDetailsPageComponent } from './address-details-page.component';

describe('AddressDetailsPageComponent', () => {
  let component: AddressDetailsPageComponent;
  let fixture: ComponentFixture<AddressDetailsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddressDetailsPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddressDetailsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
