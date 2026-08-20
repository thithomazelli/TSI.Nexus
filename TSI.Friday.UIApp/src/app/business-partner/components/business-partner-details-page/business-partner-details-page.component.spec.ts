import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientDetailsPageComponent } from './business-partner-details-page.component';

describe('ClientDetailsPageComponent', () => {
  let component: ClientDetailsPageComponent;
  let fixture: ComponentFixture<ClientDetailsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ClientDetailsPageComponent],
}).compileComponents();

    fixture = TestBed.createComponent(ClientDetailsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
