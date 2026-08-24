import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuoteDetailsModalComponent } from './quote-details-modal.component';

describe('QuoteDetailsModalComponent', () => {
  let component: QuoteDetailsModalComponent;
  let fixture: ComponentFixture<QuoteDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QuoteDetailsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuoteDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
