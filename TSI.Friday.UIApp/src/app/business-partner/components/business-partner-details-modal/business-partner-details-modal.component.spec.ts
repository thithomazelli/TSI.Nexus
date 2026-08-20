import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientDetailsModalComponent } from './business-partner-details-modal.component';

describe('ClientDetailsModalComponent', () => {
  let component: ClientDetailsModalComponent;
  let fixture: ComponentFixture<ClientDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ClientDetailsModalComponent],
}).compileComponents();

    fixture = TestBed.createComponent(ClientDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
